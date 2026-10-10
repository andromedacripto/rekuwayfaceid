import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = session.sub
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [totalVerifications, thisMonth, byStatus, recentAlerts, usageLimits] = await Promise.all([
    prisma.verification.count({ where: { companyId } }),
    prisma.verification.count({ where: { companyId, requestedAt: { gte: startOfMonth } } }),
    prisma.verification.groupBy({
      by: ['status'],
      where: { companyId, requestedAt: { gte: last30 } },
      _count: { status: true },
    }),
    prisma.auditEvent.count({
      where: { companyId, severity: { in: ['ALERT', 'SUSPICIOUS', 'CONFIRMED_FRAUD'] }, createdAt: { gte: last30 } },
    }),
    prisma.usageLimit.findUnique({ where: { companyId } }),
  ])

  const statusMap = Object.fromEntries(byStatus.map((s) => [s.status, s._count.status]))

  return NextResponse.json({
    totalVerifications,
    thisMonth,
    verified: statusMap['VERIFIED'] ?? 0,
    refused: statusMap['REFUSED'] ?? 0,
    inconclusive: statusMap['INCONCLUSIVE'] ?? 0,
    requiresReview: statusMap['REQUIRES_REVIEW'] ?? 0,
    recentAlerts,
    usage: usageLimits,
  })
}
