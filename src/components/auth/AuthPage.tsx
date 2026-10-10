'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { VerificationOutcome } from '@/components/face/FaceVerificationModal'

// Lazy-load the modal so TensorFlow.js doesn't block initial page load
const FaceVerificationModal = dynamic(() => import('@/components/face/FaceVerificationModal'), {
  ssr: false,
})

type Mode = 'login' | 'register'

interface Props {
  mode: Mode
}

export default function AuthPage({ mode }: Props) {
  const router = useRouter()
  const isRegister = mode === 'register'

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Face verification modal state (login only)
  const [showFaceModal, setShowFaceModal] = useState(false)
  const [faceRequired, setFaceRequired] = useState(false)
  const [pendingApiKey, setPendingApiKey] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body = isRegister ? form : { email: form.email, password: form.password }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data?.error?.fieldErrors) {
          setFieldErrors(data.error.fieldErrors as Record<string, string[]>)
        } else {
          setError(data?.error?.message ?? 'Ocorreu um erro. Tente novamente.')
        }
        return
      }

      if (!isRegister) {
        // Fetch API key for face verification
        const keysRes = await fetch('/api/dashboard/api-keys')
        if (keysRes.ok) {
          const keysData = await keysRes.json()
          const firstKey = keysData?.keys?.[0]
          if (firstKey) {
            setPendingApiKey(firstKey.keyPrefix + '...')
          }
        }
        // Trigger face verification step
        setFaceRequired(true)
        setShowFaceModal(true)
        return
      }

      router.replace('/dashboard')
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleFaceResult = useCallback((outcome: VerificationOutcome) => {
    setShowFaceModal(false)
    if (outcome.status === 'VERIFIED' || outcome.status === 'INCONCLUSIVE') {
      // Allow login (INCONCLUSIVE is recorded as alert but doesn't block)
      router.replace('/dashboard')
    } else if (outcome.status === 'REFUSED') {
      setError('Verificação facial recusada. Acesso negado por segurança.')
      setFaceRequired(false)
    }
  }, [router])

  const skipFace = useCallback(() => {
    setShowFaceModal(false)
    router.replace('/dashboard')
  }, [router])

  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg-gradient)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: 'var(--accent)', color: '#080c10' }}
          >
            <span className="display text-xl font-bold">R</span>
          </div>
          <div className="text-center">
            <p className="display text-base font-semibold" style={{ color: 'var(--ink)' }}>
              Rekuway Face ID
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {isRegister ? 'Crie sua conta empresarial' : 'Acesse seu painel'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
        >
          {error && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl p-4"
              style={{ background: 'var(--danger-dim)', border: '1px solid rgba(232,82,106,0.2)' }}
            >
              <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-sm" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {isRegister && (
              <Field
                label="Nome da empresa"
                type="text"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Acme Corp"
                errors={fieldErrors['name']}
                required
              />
            )}
            <Field
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="empresa@dominio.com"
              errors={fieldErrors['email']}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-3 pr-12 text-sm outline-none transition-colors"
                  style={{
                    background: 'var(--surface-muted)',
                    color: 'var(--ink)',
                    border: '1px solid var(--border)',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--subtle)' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors['password']?.map((e) => (
                <p key={e} className="text-xs" style={{ color: 'var(--danger)' }}>
                  {e}
                </p>
              ))}
              {isRegister && (
                <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                  Mín. 8 caracteres, maiúscula, número e símbolo.
                </p>
              )}
            </div>

            {isRegister && (
              <div
                className="rounded-xl p-4 text-xs leading-relaxed"
                style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}
              >
                <Shield size={12} className="mb-1 inline" style={{ color: 'var(--accent)' }} /> Ao criar sua conta,
                você concorda com o tratamento de dados conforme nossa Política de Privacidade e com as obrigações
                relativas a dados biométricos dos usuários finais da sua plataforma.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl py-3.5 text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#080c10' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
            >
              {loading ? 'Aguarde...' : isRegister ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
            {isRegister ? 'Já tem uma conta?' : 'Não tem conta?'}{' '}
            <button
              onClick={() => router.push(isRegister ? '/login' : '/register')}
              className="font-medium"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            >
              {isRegister ? 'Entrar' : 'Criar conta gratuita'}
            </button>
          </p>
        </div>
      </div>

      {/* Face verification modal — fires after credentials OK */}
      {faceRequired && (
        <FaceVerificationModal
          open={showFaceModal}
          onClose={skipFace}
          onResult={handleFaceResult}
          apiKey={pendingApiKey ?? 'demo'}
          title="Confirme sua identidade"
          description="Como etapa adicional de segurança, precisamos verificar seu rosto."
        />
      )}
    </div>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  errors,
  required,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  errors?: string[]
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-xl px-4 py-3 text-sm outline-none transition-colors"
        style={{
          background: 'var(--surface-muted)',
          color: 'var(--ink)',
          border: `1px solid ${errors?.length ? 'var(--danger)' : 'var(--border)'}`,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = errors?.length ? 'var(--danger)' : 'var(--border)')
        }
      />
      {errors?.map((e) => (
        <p key={e} className="text-xs" style={{ color: 'var(--danger)' }}>
          {e}
        </p>
      ))}
    </div>
  )
}
