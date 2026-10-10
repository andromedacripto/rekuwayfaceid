'use client'

import { useEffect, useState } from 'react'
import { ScanFace, CheckCircle, XCircle, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react'

interface Stats {
  totalVerifications: number
  thisMonth: number
  verified: number
  refused: number
  inconclusive: number
  requiresReview: number
  recentAlerts: number
  usage: { usedThisMonth: number; monthlyVerifications: number } | null
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [])

  const cards = stats
    ? [
        {
          label: 'Total verificações',
          value: stats.totalVerifications,
          icon: ScanFace,
          color: 'var(--accent)',
          dimColor: 'var(--accent-dim)',
        },
        {
          label: 'Verificadas',
          value: stats.verified,
          icon: CheckCircle,
          color: 'var(--success)',
          dimColor: 'var(--success-dim)',
        },
        {
          label: 'Recusadas',
          value: stats.refused,
          icon: XCircle,
          color: 'var(--danger)',
          dimColor: 'var(--danger-dim)',
        },
        {
          label: 'Alertas (30d)',
          value: stats.recentAlerts,
          icon: AlertTriangle,
          color: 'var(--warning)',
          dimColor: 'var(--warning-dim)',
        },
      ]
    : []

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="display text-2xl font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Visão geral
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Resumo das verificações e alertas da sua empresa.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="skeleton h-24 rounded-2xl"
                style={{ border: '1px solid var(--border)' }}
              />
            ))
          : cards.map((c) => (
              <div
                key={c.label}
                className="rounded-2xl p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>
                    {c.label}
                  </p>
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: c.dimColor }}
                  >
                    <c.icon size={14} style={{ color: c.color }} />
                  </div>
                </div>
                <p
                  className="display text-3xl font-semibold tabular-nums"
                  style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
                >
                  {c.value.toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
      </div>

      {/* Usage bar */}
      {stats?.usage && (
        <div
          className="mb-8 rounded-2xl p-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Uso este mês
              </p>
            </div>
            <p className="mono text-sm tabular-nums" style={{ color: 'var(--muted)' }}>
              {stats.usage.usedThisMonth.toLocaleString('pt-BR')} /{' '}
              {stats.usage.monthlyVerifications.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--surface-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (stats.usage.usedThisMonth / stats.usage.monthlyVerifications) * 100)}%`,
                background:
                  stats.usage.usedThisMonth / stats.usage.monthlyVerifications > 0.9
                    ? 'var(--danger)'
                    : 'var(--accent)',
              }}
            />
          </div>
        </div>
      )}

      {/* Requires review */}
      {stats && stats.requiresReview > 0 && (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--warning-dim)', border: '1px solid rgba(240,169,64,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>
                {stats.requiresReview} verificação{stats.requiresReview !== 1 ? 'ões' : ''} aguardando revisão
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--warning)' }}>
                O motor de risco sinalizou estas verificações para análise humana.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      )}
    </div>
  )
}
