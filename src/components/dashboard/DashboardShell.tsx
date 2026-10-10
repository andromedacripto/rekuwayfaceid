'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ScanFace,
  Key,
  AlertTriangle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { href: '/dashboard/verifications', label: 'Verificações', icon: ScanFace },
  { href: '/dashboard/api-keys', label: 'Chaves de API', icon: Key },
  { href: '/dashboard/events', label: 'Eventos', icon: AlertTriangle },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

interface CompanyInfo {
  name: string
  plan: string
  email: string
}

interface SidebarProps {
  pathname: string
  company: CompanyInfo | null
  onNavigate: (href: string) => void
  onLogout: () => void
}

function Sidebar({ pathname, company, onNavigate, onLogout }: SidebarProps) {
  return (
    <div
      className="flex h-full flex-col"
      style={{ background: 'var(--surface-muted)', borderRight: '1px solid var(--border)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: 'var(--accent)', color: '#080c10' }}
        >
          <span className="display text-sm font-bold">R</span>
        </div>
        <div>
          <p className="display text-xs font-semibold" style={{ color: 'var(--ink)' }}>
            Rekuway Face ID
          </p>
          {company && (
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>
              {company.plan}
            </p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => onNavigate(item.href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left"
                style={{
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  border: active ? '1px solid rgba(79,163,227,0.15)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--surface)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Company + Logout */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        {company && (
          <div className="mb-3 rounded-xl px-3 py-3" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: 'var(--accent)' }} />
              <p className="truncate text-xs font-medium" style={{ color: 'var(--ink)' }}>
                {company.name}
              </p>
            </div>
            <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--subtle)' }}>
              {company.email}
            </p>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger-dim)'
            e.currentTarget.style.color = 'var(--danger)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--muted)'
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </div>
  )
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [company, setCompany] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { company: CompanyInfo }) =>
        setCompany({ name: d.company.name, plan: d.company.plan, email: d.company.email }),
      )
      .catch(() => router.replace('/login'))
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  function handleNavigate(href: string) {
    router.push(href)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-dvh" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-0 h-dvh">
          <Sidebar
            pathname={pathname}
            company={company}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-64">
            <Sidebar
              pathname={pathname}
              company={company}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <div
          className="flex items-center justify-between px-4 py-3 lg:hidden"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-muted)' }}
        >
          <button onClick={() => setMobileOpen(true)} style={{ color: 'var(--ink)' }}>
            <Menu size={20} />
          </button>
          <p className="display text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Rekuway Face ID
          </p>
          <button onClick={() => setMobileOpen(false)} style={{ color: 'var(--subtle)' }}>
            <X size={20} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  )
}
