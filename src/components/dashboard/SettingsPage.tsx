'use client'

import { useEffect, useState } from 'react'
import { Shield, Info, Loader2, CheckCircle } from 'lucide-react'

interface CompanyInfo {
  id: string
  name: string
  email: string
  plan: string
  status: string
  createdAt: string
}

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setCompany(d.company))
      .finally(() => setLoading(false))
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    // Placeholder — connect to PATCH /api/dashboard/company in a future iteration
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const planLabels: Record<string, string> = {
    FREE: 'Gratuito — 100 verificações/mês',
    STARTER: 'Starter — 1.000 verificações/mês',
    PROFESSIONAL: 'Professional — 10.000 verificações/mês',
    ENTERPRISE: 'Enterprise — ilimitado (sob contrato)',
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="display text-2xl font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          Configurações
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Dados da empresa e informações do plano.
        </p>
      </div>

      {/* Company info */}
      <div
        className="mb-6 rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="mb-5 flex items-center gap-2">
          <Shield size={16} style={{ color: 'var(--accent)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Dados da empresa
          </h2>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Nome
            </label>
            <input
              defaultValue={company?.name ?? ''}
              className="rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              E-mail
            </label>
            <input
              defaultValue={company?.email ?? ''}
              type="email"
              disabled
              className="rounded-xl px-4 py-3 text-sm outline-none opacity-50 cursor-not-allowed"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
            />
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>
              O e-mail é usado como identificador de login e não pode ser alterado aqui.
            </p>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={{ background: saved ? 'var(--success-dim)' : 'var(--accent)', color: saved ? 'var(--success)' : '#080c10' }}
          >
            {saved ? (
              <>
                <CheckCircle size={14} />
                Salvo
              </>
            ) : (
              'Salvar alterações'
            )}
          </button>
        </form>
      </div>

      {/* Plan */}
      <div
        className="mb-6 rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          Plano atual
        </h2>
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--accent-dim)', border: '1px solid rgba(79,163,227,0.15)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            {company?.plan ?? 'FREE'}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--ink-2)' }}>
            {planLabels[company?.plan ?? 'FREE']}
          </p>
        </div>
        <p className="mt-4 text-xs" style={{ color: 'var(--subtle)' }}>
          Para alterar seu plano ou contratar verificações adicionais, entre em contato com o time comercial Rekuway.
        </p>
      </div>

      {/* LGPD notice */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Info size={14} style={{ color: 'var(--accent)' }} />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            Privacidade e LGPD
          </p>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--subtle)' }}>
          O Rekuway Face ID processa dados biométricos dos usuários finais das suas aplicações. Como controlador desses
          dados, sua empresa é responsável por obter o consentimento adequado, informar os titulares sobre o
          tratamento e garantir o cumprimento da LGPD. Não armazenamos imagens faciais após o processamento, exceto
          quando a sua política de retenção exigir e o usuário tiver consentido. Consulte nossa Política de Privacidade
          completa antes de entrar em produção.
        </p>
      </div>

      {/* Account info */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--subtle)' }}>
        <span>ID: <span className="mono">{company?.id}</span></span>
        <span>Conta criada em: {company ? new Date(company.createdAt).toLocaleDateString('pt-BR') : '—'}</span>
        <span style={{ color: company?.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' }}>
          {company?.status === 'ACTIVE' ? 'Ativo' : company?.status}
        </span>
      </div>
    </div>
  )
}
