'use client'

import { useEffect, useState, useCallback } from 'react'
import { ScanFace, Loader2, CheckCircle, XCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { VerificationOutcome } from '@/components/face/FaceVerificationModal'

const FaceVerificationModal = dynamic(
  () => import('@/components/face/FaceVerificationModal'),
  { ssr: false },
)

type VerifStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'VERIFIED'
  | 'REFUSED'
  | 'INCONCLUSIVE'
  | 'EXPIRED'
  | 'REQUIRES_REVIEW'

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

const STATUS_CONFIG: Record<
  VerifStatus,
  { label: string; color: string; bg: string; Icon: typeof CheckCircle }
> = {
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
  const [reqId, setReqId] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [lastResult, setLastResult] = useState<VerificationOutcome | null>(null)
  const limit = 20

  const reload = useCallback(() => setReqId((n) => n + 1), [])

  const handleVerified = useCallback(
    (res: VerificationOutcome) => {
      setLastResult(res)
      setTimeout(reload, 1200)
    },
    [reload],
  )

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter) params.set('status', filter)
    fetch(`/api/dashboard/verifications?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { verifications?: Verification[]; total?: number }) => {
        setVerifications(d.verifications ?? [])
        setTotal(d.total ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    return () => controller.abort()
  }, [page, filter, reqId])

  const filters: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'VERIFIED', label: 'Verificado' },
    { value: 'REFUSED', label: 'Recusado' },
    { value: 'REQUIRES_REVIEW', label: 'Revisão' },
    { value: 'INCONCLUSIVE', label: 'Inconclusivo' },
  ]

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="display text-2xl font-semibold"
              style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
            >
              Verificações
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {total.toLocaleString('pt-BR')} registros
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors text-white"
              style={{ background: 'var(--accent)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <ScanFace size={13} />
              Testar verificação facial
            </button>
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value)
                  setPage(1)
                }}
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
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Fazer primeira verificação
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['ID', 'Ref. externa', 'Status', 'Risco', 'Liveness', 'Solicitado em'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium uppercase tracking-widest"
                          style={{ color: 'var(--subtle)' }}
                        >
                          {h}
                        </th>
                      ),
                    )}
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
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--surface-muted)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
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
                        <td
                          className="px-4 py-3 text-xs"
                          style={{
                            color:
                              v.livenessPass
                                ? 'var(--success)'
                                : v.livenessPass === false
                                  ? 'var(--danger)'
                                  : 'var(--subtle)',
                          }}
                        >
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

          {total > limit && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
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

      {/* Result toast */}
      {lastResult && (
        <div
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-sans shadow-xl"
          style={{
            background:
              lastResult.status === 'VERIFIED'
                ? 'rgba(26,128,71,0.95)'
                : lastResult.status === 'REFUSED'
                  ? 'rgba(186,43,76,0.95)'
                  : 'rgba(180,130,30,0.95)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <span className="text-white font-medium">
            {lastResult.status === 'VERIFIED'
              ? 'Verificado'
              : lastResult.status === 'REFUSED'
                ? 'Recusado'
                : 'Inconclusivo'}
          </span>
          {'verificationId' in lastResult && lastResult.verificationId && (
            <span className="text-white/70 tabular-nums text-xs font-mono">
              {lastResult.verificationId.slice(0, 8)}
            </span>
          )}
          <button
            onClick={() => setLastResult(null)}
            className="text-white/50 hover:text-white ml-1"
          >
            ×
          </button>
        </div>
      )}

      <FaceVerificationModal
        open={modalOpen}
        onResult={handleVerified}
        onClose={() => setModalOpen(false)}
        apiKey="demo"
        title="Testar Verificação Facial"
        description="Demonstração ao vivo: captura, prova de vida e análise de risco."
      />
    </>
  )
}
