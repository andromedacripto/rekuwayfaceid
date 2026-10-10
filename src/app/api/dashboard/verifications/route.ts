import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
  const status = searchParams.get('status') ?? undefined

  const [verifications, total] = await Promise.all([
    prisma.verification.findMany({
      where: { companyId: session.sub, ...(status ? { status: status as never } : {}) },
      orderBy: { requestedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
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
      },
    }),
    prisma.verification.count({
      where: { companyId: session.sub, ...(status ? { status: status as never } : {}) },
    }),
  ])

  return NextResponse.json({ verifications, total, page, limit })
}
