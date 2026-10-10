import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromRequest } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const key = await prisma.apiKey.findFirst({
    where: { id, companyId: session.sub },
  })

  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.apiKey.update({
    where: { id },
    data: { status: 'REVOKED', revokedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
