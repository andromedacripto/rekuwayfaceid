'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Info, Loader2, ShieldAlert } from 'lucide-react'

type Severity = 'INFO' | 'ALERT' | 'SUSPICIOUS' | 'CONFIRMED_FRAUD'

interface AuditEvent {
  id: string
  eventType: string
  severity: Severity
  summary: string
  ipAddress: string | null
  createdAt: string
  verificationId: string | null
}

const SEV_CONFIG: Record<Severity, { label: string; color: string; bg: string; Icon: typeof Info }> = {
  INFO: { label: 'Info', color: 'var(--muted)', bg: 'var(--surface-muted)', Icon: Info },
  ALERT: { label: 'Alerta', color: 'var(--warning)', bg: 'var(--warning-dim)', Icon: AlertTriangle },
  SUSPICIOUS: { label: 'Suspeito', color: 'var(--danger)', bg: 'var(--danger-dim)', Icon: ShieldAlert },
  CONFIRMED_FRAUD: { label: 'Fraude', color: 'var(--danger)', bg: 'var(--danger-dim)', Icon: ShieldAlert },
}

export default function EventsPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const limit = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter) params.set('severity', filter)
    fetch(`/api/dashboard/events?${params}`)
      .then((r) => r.json())
      .then((d) => { setEvents(d.events ?? []); setTotal(d.total ?? 0) })
      .finally(() => setLoading(false))
  }, [page, filter])

  const filters = [
    { value: '', label: 'Todos' },
    { value: 'ALERT', label: 'Alertas' },
    { value: 'SUSPICIOUS', label: 'Suspeitos' },
    { value: 'CONFIRMED_FRAUD', label: 'Fraude' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display text-2xl font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Eventos de Auditoria
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Registro completo de sinais de segurança e alertas de fraude.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1) }}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filter === f.value ? 'var(--accent-dim)' : 'var(--surface)',
                color: filter === f.value ? 'var(--accent)' : 'var(--muted)',
                border: `1px solid ${filter === f.value ? 'rgba(79,163,227,0.2)' : 'var(--border)'}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Info size={32} style={{ color: 'var(--subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Nenhum evento registrado.
            </p>
          </div>
        ) : (
          events.map((ev, i) => {
            const cfg = SEV_CONFIG[ev.severity] ?? SEV_CONFIG['INFO']
            return (
              <div
                key={ev.id}
                className="flex items-start gap-4 px-5 py-4 transition-colors"
                style={{ borderBottom: i < events.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: cfg.bg }}
                >
                  <cfg.Icon size={13} style={{ color: cfg.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="mono text-xs font-medium" style={{ color: 'var(--ink)' }}>
                      {ev.eventType}
                    </p>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-xs font-medium"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    {ev.summary}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3">
                    <span className="text-xs" style={{ color: 'var(--subtle)' }}>
                      {new Date(ev.createdAt).toLocaleString('pt-BR')}
                    </span>
                    {ev.ipAddress && (
                      <span className="mono text-xs" style={{ color: 'var(--subtle)' }}>
                        {ev.ipAddress}
                      </span>
                    )}
                    {ev.verificationId && (
                      <span className="mono text-xs" style={{ color: 'var(--subtle)' }}>
                        Verif: {ev.verificationId.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}

        {total > limit && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>
              Página {page} de {Math.ceil(total / limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
