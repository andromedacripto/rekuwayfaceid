import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { getSessionFromRequest, generateApiKey, hashApiKey } from '@/lib/auth'
import { createApiKeySchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { companyId: session.sub },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      environment: true,
      status: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
      revokedAt: true,
    },
  })

  return NextResponse.json({ keys })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createApiKeySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const { name, environment, expiresAt } = parsed.data
  const env = environment === 'PRODUCTION' ? 'live' : 'sandbox'

  const { key, prefix } = generateApiKey(env)
  const keyHash = await hashApiKey(key)

  const record = await prisma.apiKey.create({
    data: {
      companyId: session.sub,
      name,
      keyPrefix: prefix,
      keyHash,
      environment,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    },
    select: { id: true, name: true, keyPrefix: true, environment: true, createdAt: true },
  })

  // Return the full key ONCE — it will never be shown again
  return NextResponse.json({ ...record, fullKey: key }, { status: 201 })
}
