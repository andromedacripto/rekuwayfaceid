import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { email, password } = parsed.data

    const company = await prisma.company.findUnique({
      where: { email },
      include: { users: { where: { email }, take: 1 } },
    })

    // Constant-time: verify even when company not found to avoid timing oracle
    const dummyHash = '$2a$12$dummyhashfortimingneutralityAAAAAAAAAAAAAAAAAAAAAAAA'
    const hash = company?.passwordHash ?? dummyHash
    const valid = await verifyPassword(password, hash)

    if (!company || !valid || company.status !== 'ACTIVE') {
      return NextResponse.json({ error: { message: 'Invalid credentials' } }, { status: 401 })
    }

    const user = company.users[0]

    const token = await signToken({
      sub: company.id,
      userId: user?.id ?? company.id,
      email: company.email,
      role: user?.role ?? 'ADMIN',
    })

    // Update last login
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    }

    const res = NextResponse.json({ success: true, companyId: company.id, name: company.name })
    res.cookies.set('rfid_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 })
  }
}
