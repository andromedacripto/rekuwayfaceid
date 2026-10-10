'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Trash2, Copy, CheckCircle, AlertTriangle, Loader2, Eye, EyeOff } from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  environment: 'SANDBOX' | 'PRODUCTION'
  status: 'ACTIVE' | 'REVOKED'
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [newKeyCopied, setNewKeyCopied] = useState(false)
  const [showNewKey, setShowNewKey] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<{ name: string; environment: 'SANDBOX' | 'PRODUCTION' }>({ name: '', environment: 'SANDBOX' })

  const load = () =>
    fetch('/api/dashboard/api-keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? []))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  async function create() {
    setCreating(true)
    try {
      const res = await fetch('/api/dashboard/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setNewKey(data.fullKey)
        setShowCreate(false)
        load()
      }
    } finally {
      setCreating(false)
    }
  }

  async function revoke(id: string) {
    if (!confirm('Revogar esta chave? Esta ação não pode ser desfeita.')) return
    await fetch(`/api/dashboard/api-keys/${id}/revoke`, { method: 'POST' })
    load()
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key)
    setNewKeyCopied(true)
    setTimeout(() => setNewKeyCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="display text-2xl font-semibold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Chaves de API
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Gerencie as credenciais para integrar o Rekuway Face ID.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: '#080c10' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <Plus size={16} />
          Nova chave
        </button>
      </div>

      {/* New key revealed */}
      {newKey && (
        <div
          className="mb-6 rounded-2xl p-5"
          style={{ background: 'var(--success-dim)', border: '1px solid rgba(79,195,138,0.2)' }}
        >
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle size={16} style={{ color: 'var(--success)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
              Chave criada. Copie agora — ela nunca sera exibida novamente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="mono flex-1 overflow-x-auto rounded-xl px-4 py-3 text-xs"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
            >
              {showNewKey ? newKey : '•'.repeat(Math.min(newKey.length, 60))}
            </div>
            <button onClick={() => setShowNewKey((s) => !s)} className="p-2" style={{ color: 'var(--muted)' }}>
              {showNewKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={() => copyKey(newKey)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: 'var(--surface)', color: newKeyCopied ? 'var(--success)' : 'var(--muted)' }}
            >
              {newKeyCopied ? <CheckCircle size={12} /> : <Copy size={12} />}
              {newKeyCopied ? 'Copiado' : 'Copiar'}
            </button>
            <button onClick={() => setNewKey(null)} className="text-xs" style={{ color: 'var(--subtle)' }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div
          className="mb-6 rounded-2xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="mb-4 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Nova chave de API
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Produção App iOS"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
            <select
              value={form.environment}
              onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value as 'SANDBOX' | 'PRODUCTION' }))}
              className="rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink)', border: '1px solid var(--border)' }}
            >
              <option value="SANDBOX">Sandbox</option>
              <option value="PRODUCTION">Produção</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={create}
              disabled={creating || !form.name.trim()}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#080c10' }}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : null}
              Criar
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-sm"
              style={{ color: 'var(--muted)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : keys.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <Key size={32} style={{ color: 'var(--subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Nenhuma chave criada ainda.
            </p>
          </div>
        ) : (
          keys.map((k, i) => (
            <div
              key={k.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: i < keys.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                    {k.name}
                  </p>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-xs font-medium"
                    style={{
                      background: k.environment === 'PRODUCTION' ? 'var(--accent-dim)' : 'var(--surface-muted)',
                      color: k.environment === 'PRODUCTION' ? 'var(--accent)' : 'var(--subtle)',
                    }}
                  >
                    {k.environment === 'PRODUCTION' ? 'Produção' : 'Sandbox'}
                  </span>
                  {k.status === 'REVOKED' && (
                    <span
                      className="rounded-md px-1.5 py-0.5 text-xs font-medium"
                      style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}
                    >
                      Revogada
                    </span>
                  )}
                </div>
                <p className="mono mt-1 text-xs" style={{ color: 'var(--subtle)' }}>
                  {k.keyPrefix}•••••••••••••
                </p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>
                  Criada em {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                  {k.lastUsedAt ? ` · Último uso ${new Date(k.lastUsedAt).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>
              {k.status === 'ACTIVE' && (
                <button
                  onClick={() => revoke(k.id)}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: 'var(--danger)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--danger-dim)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={12} />
                  Revogar
                </button>
              )}
              {k.status === 'REVOKED' && (
                <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Security note */}
      <div
        className="mt-4 rounded-xl p-4 text-xs leading-relaxed"
        style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}
      >
        As chaves de API nunca são armazenadas em texto claro. Apenas o prefixo é exibido após a criação. Nunca
        exponha chaves de produção no código frontend ou em repositórios públicos.
      </div>
    </div>
  )
}
