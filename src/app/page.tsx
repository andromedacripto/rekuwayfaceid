'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // If already logged in, go straight to dashboard
    fetch('/api/auth/me')
      .then((r) => (r.ok ? router.replace('/dashboard') : null))
      .catch(() => null)
  }, [router])

  return <LandingPage />
}
