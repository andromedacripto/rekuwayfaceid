/**
 * POST /api/v1/verify
 *
 * Public API endpoint — authenticated with Bearer API key.
 * Accepts a facial image, runs liveness + match, applies risk engine,
 * persists the verification record, and returns a signed result.
 *
 * Version: v1
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { authenticateApiKey, apiError, apiOk } from '@/lib/api-middleware'
import { runFacialVerification } from '@/lib/facial-provider'
import { evaluateRisk } from '@/lib/risk-engine'
import { createVerificationSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  // Auth
  const auth = await authenticateApiKey(req)
  if ('error' in auth) return auth.error

  const { ctx } = auth

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid JSON body', 400, 'BAD_REQUEST')
  }

  const parsed = createVerificationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { imageBase64, referenceBase64, livenessCheck, externalRef } = parsed.data

  // Check usage limits
  const usage = await prisma.usageLimit.findUnique({ where: { companyId: ctx.companyId } })
  if (usage && usage.usedThisMonth >= usage.monthlyVerifications) {
    return apiError('Monthly verification limit reached', 429, 'USAGE_LIMIT_EXCEEDED')
  }

  // Check repeated attempts (anti-abuse)
  let attemptCount = 0
  if (externalRef) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    attemptCount = await prisma.verification.count({
      where: { companyId: ctx.companyId, externalRef, requestedAt: { gte: oneHourAgo } },
    })
  }

  // Create verification record (PENDING)
  const verification = await prisma.verification.create({
    data: {
      companyId: ctx.companyId,
      externalRef,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ipAddress: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
    },
  })

  // Run facial verification with provider
  const providerResult = await runFacialVerification({
    imageBase64,
    referenceBase64,
    livenessCheck,
    externalRef,
  })

  // If provider not configured — return clear status without simulating
  if (providerResult.status === 'NOT_CONFIGURED') {
    await prisma.verification.update({
      where: { id: verification.id },
      data: { status: 'INCONCLUSIVE', refusalReason: 'PROVIDER_NOT_CONFIGURED', completedAt: new Date() },
    })
    return NextResponse.json(
      {
        verificationId: verification.id,
        status: 'INCONCLUSIVE',
        message:
          'No facial verification provider is configured. ' +
          'Set FACIAL_PROVIDER and credentials in .env to enable real verification.',
        providerConfigured: false,
      },
      { status: 202 },
    )
  }

  // Risk evaluation
  const risk = evaluateRisk({
    livenessPass: providerResult.livenessPass,
    matchScore: providerResult.matchScore,
    attemptCount,
    userAgentAnomalous: false, // TODO: UA parser
  })

  // Determine final status
  let finalStatus: 'VERIFIED' | 'REFUSED' | 'INCONCLUSIVE' | 'REQUIRES_REVIEW' = 'INCONCLUSIVE'
  if (providerResult.status === 'VERIFIED' && risk.decision === 'ALLOW') finalStatus = 'VERIFIED'
  else if (providerResult.status === 'REFUSED' || risk.decision === 'RESTRICT') finalStatus = 'REFUSED'
  else if (risk.decision === 'REVIEW') finalStatus = 'REQUIRES_REVIEW'

  await prisma.verification.update({
    where: { id: verification.id },
    data: {
      status: finalStatus,
      riskLevel: risk.level,
      riskScore: risk.score,
      livenessPass: providerResult.livenessPass,
      matchScore: providerResult.matchScore,
      providerRef: providerResult.providerRef,
      refusalReason: providerResult.errorMessage,
      completedAt: new Date(),
    },
  })

  // Increment usage
  if (usage) {
    await prisma.usageLimit.update({
      where: { companyId: ctx.companyId },
      data: { usedThisMonth: { increment: 1 } },
    })
  }

  // Log risk events
  if (risk.signals.some((s) => ['LIVENESS_FAIL', 'EXCESSIVE_ATTEMPTS', 'LOW_MATCH_SCORE'].includes(s))) {
    await prisma.auditEvent.create({
      data: {
        companyId: ctx.companyId,
        verificationId: verification.id,
        eventType: risk.signals[0],
        severity: risk.score >= 75 ? 'SUSPICIOUS' : 'ALERT',
        summary: `Risk score ${risk.score} (${risk.level}). Signals: ${risk.signals.join(', ')}`,
        metadata: { signals: risk.signals, decision: risk.decision },
        ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      },
    })
  }

  return apiOk({
    verificationId: verification.id,
    status: finalStatus,
    riskLevel: risk.level,
    riskScore: risk.score,
    riskDecision: risk.decision,
    livenessPass: providerResult.livenessPass,
    matchScore: providerResult.matchScore,
    completedAt: new Date().toISOString(),
  })
}
