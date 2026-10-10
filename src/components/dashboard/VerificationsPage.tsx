'use client'

import { useEffect, useState } from 'react'
import { ScanFace, Loader2, CheckCircle, XCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react'

type VerifStatus = 'PENDING' | 'PROCESSING' | 'VERIFIED' | 'REFUSED' | 'INCONCLUSIVE' | 'EXPIRED' | 'REQUIRES_REVIEW'

interface Verification {
  id: string
  externalRef: string | null
  status: VerifStatus
  riskLevel: string
  riskScore: number | null
  livenessPass: boolean | null
  matchScore: number | null
  refusalReason: string | null
  requestedAt: string
  completedAt: string | null
}

const STATUS_CONFIG: Record<VerifStatus, { label: string; color: string; bg: string; Icon: typeof CheckCircle }> = {
  VERIFIED: { label: 'Verificado', color: 'var(--success)', bg: 'var(--success-dim)', Icon: CheckCircle },
  REFUSED: { label: 'Recusado', color: 'var(--danger)', bg: 'var(--danger-dim)', Icon: XCircle },
  INCONCLUSIVE: { label: 'Inconclusivo', color: 'var(--warning)', bg: 'var(--warning-dim)', Icon: HelpCircle },
  REQUIRES_REVIEW: { label: 'Revisão', color: 'var(--warning)', bg: 'var(--warning-dim)', Icon: AlertTriangle },
  PENDING: { label: 'Pendente', color: 'var(--muted)', bg: 'var(--surface-muted)', Icon: Clock },
  PROCESSING: { label: 'Processando', color: 'var(--accent)', bg: 'var(--accent-dim)', Icon: Loader2 },
  EXPIRED: { label: 'Expirado', color: 'var(--subtle)', bg: 'var(--surface-muted)', Icon: Clock },
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const limit = 20

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter) params.set('status', filter)
    fetch(`/api/dashboard/verifications?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setVerifications(d.verifications ?? [])
        setTotal(d.total ?? 0)
      })
      .finally(() => setLoading(false))
  }, [page, filter])

  const filters: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'VERIFIED', label: 'Verificado' },
    { value: 'REFUSED', label: 'Recusado' },
    { value: 'REQUIRES_REVIEW', label: 'Revisão' },
    { value: 'INCONCLUSIVE', label: 'Inconclusivo' },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="display text-2xl font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Verificações
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {total.toLocaleString('pt-BR')} registros
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
        ) : verifications.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <ScanFace size={32} style={{ color: 'var(--subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Nenhuma verificação encontrada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Ref. externa', 'Status', 'Risco', 'Liveness', 'Solicitado em'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest"
                      style={{ color: 'var(--subtle)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {verifications.map((v) => {
                  const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG['PENDING']
                  return (
                    <tr
                      key={v.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      className="transition-colors"
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="mono px-4 py-3 text-xs" style={{ color: 'var(--subtle)' }}>
                        {v.id.slice(0, 8)}…
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--ink-2)' }}>
                        {v.externalRef ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          <cfg.Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-lg px-2 py-0.5 text-xs font-medium tabular-nums"
                          style={{
                            background:
                              v.riskLevel === 'HIGH' || v.riskLevel === 'CRITICAL'
                                ? 'var(--danger-dim)'
                                : v.riskLevel === 'MEDIUM'
                                  ? 'var(--warning-dim)'
                                  : 'var(--surface-muted)',
                            color:
                              v.riskLevel === 'HIGH' || v.riskLevel === 'CRITICAL'
                                ? 'var(--danger)'
                                : v.riskLevel === 'MEDIUM'
                                  ? 'var(--warning)'
                                  : 'var(--subtle)',
                          }}
                        >
                          {v.riskLevel}
                          {v.riskScore != null ? ` (${v.riskScore.toFixed(0)})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: v.livenessPass ? 'var(--success)' : v.livenessPass === false ? 'var(--danger)' : 'var(--subtle)' }}>
                        {v.livenessPass == null ? '—' : v.livenessPass ? 'Passou' : 'Falhou'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--subtle)' }}>
                        {new Date(v.requestedAt).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>
              Página {page} de {Math.ceil(total / limit)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(total / limit)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
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
