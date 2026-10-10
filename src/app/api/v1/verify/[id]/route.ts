/**
 * GET /api/v1/verify/:id
 * Fetch the result of a verification by ID (authenticated via API key).
 */
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { authenticateApiKey, apiError, apiOk } from '@/lib/api-middleware'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApiKey(req)
  if ('error' in auth) return auth.error

  const { id } = await params

  const verification = await prisma.verification.findFirst({
    where: { id, companyId: auth.ctx.companyId },
    select: {
      id: true,
      externalRef: true,
      status: true,
      riskLevel: true,
      riskScore: true,
      livenessPass: true,
      matchScore: true,
      refusalReason: true,
      requestedAt: true,
      completedAt: true,
      expiresAt: true,
    },
  })

  if (!verification) return apiError('Verification not found', 404, 'NOT_FOUND')
  return apiOk(verification)
}
