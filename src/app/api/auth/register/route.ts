import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { registerSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const { name, email, password } = parsed.data

    const existing = await prisma.company.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: { message: 'Email already registered' } }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    const company = await prisma.company.create({
      data: {
        name,
        email,
        passwordHash,
        usageLimits: {
          create: {
            monthlyVerifications: 100,
            usedThisMonth: 0,
            resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
        users: {
          create: {
            name,
            email,
            passwordHash,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    })

    const token = await signToken({
      sub: company.id,
      userId: company.users[0].id,
      email: company.email,
      role: 'ADMIN',
    })

    const res = NextResponse.json({ success: true, companyId: company.id }, { status: 201 })
    res.cookies.set('rfid_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })
    return res
  } catch (err) {
    console.error('register error', err)
    return NextResponse.json({ error: { message: 'Internal server error' } }, { status: 500 })
  }
}
