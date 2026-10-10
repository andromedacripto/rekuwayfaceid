import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      service: 'rekuway-faceid',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'disconnected' },
      { status: 503 },
    )
  }
}
