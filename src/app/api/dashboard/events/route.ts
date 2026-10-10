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
  const severity = searchParams.get('severity') ?? undefined

  const [events, total] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { companyId: session.sub, ...(severity ? { severity: severity as never } : {}) },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditEvent.count({
      where: { companyId: session.sub, ...(severity ? { severity: severity as never } : {}) },
    }),
  ])

  return NextResponse.json({ events, total, page, limit })
}
