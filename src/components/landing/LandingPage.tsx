'use client'

import { useRouter } from 'next/navigation'
import { Shield, Eye, Cpu, Lock, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  const pillars = [
    {
      icon: Eye,
      title: 'Verificação Facial Inteligente',
      description:
        'Captura facial em tempo real com prova de vida para dificultar ataques com fotos, vídeos e rostos sintéticos.',
    },
    {
      icon: AlertTriangle,
      title: 'Combate à Fraude de Identidade',
      description:
        'Detecção de padrões suspeitos, tentativas repetidas e sinais de tomada indevida de conta com registro de auditoria.',
    },
    {
      icon: Cpu,
      title: 'Defesa Adaptativa com IA',
      description:
        'Motor de risco que analisa sinais disponíveis e aplica regras proporcionais: permitir, verificar novamente, restringir ou revisar.',
    },
    {
      icon: Lock,
      title: 'Proteção Pós-Login',
      description:
        'Camada adicional para ações sensíveis: alteração de dados, recuperação de conta e operações de alto risco.',
    },
  ]

  const features = [
    'Painel empresarial com métricas e histórico',
    'API comercial documentada e versionada',
    'Gerenciamento de chaves de API e webhooks',
    'Segregação total de dados entre clientes',
    'Auditoria completa de eventos',
    'Estrutura para planos e cobrança por volume',
  ]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)', color: 'var(--ink)' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{ background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--accent)', color: '#080c10' }}
          >
            <span className="display text-sm font-bold">R</span>
          </div>
          <span className="display text-sm font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
            Rekuway Face ID
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: 'var(--muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            Entrar
          </button>
          <button
            onClick={() => router.push('/register')}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#080c10' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-24 text-center md:px-12">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(79,163,227,0.25)' }}
        >
          <Shield size={12} />
          Verificação de identidade empresarial
        </div>

        <h1
          className="display mx-auto mb-6 max-w-3xl text-4xl font-bold md:text-6xl"
          style={{ color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1.1 }}
        >
          Verificação facial inteligente e prevenção contra fraudes
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          Ajude sua empresa a verificar identidades, identificar sinais de fraude e proteger contas antes e depois do
          login. Solução SaaS com API própria, painel empresarial e arquitetura multi-tenant.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.push('/register')}
            className="flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#080c10' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Criar conta gratuita
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="rounded-xl px-8 py-4 text-base font-medium transition-colors"
            style={{ color: 'var(--ink-2)', border: '1px solid var(--border)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            Já tenho conta
          </button>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-12">
        <h2
          className="display mb-3 text-center text-2xl font-semibold md:text-3xl"
          style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
        >
          Quatro pilares de segurança
        </h2>
        <p className="mb-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Não é apenas reconhecimento facial — é uma plataforma de defesa em camadas.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--accent-dim)' }}
              >
                <p.icon size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="display mb-2 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        className="mx-auto max-w-4xl px-6 pb-24 md:px-12"
      >
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <h2
            className="display mb-8 text-2xl font-semibold md:text-3xl"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            Plataforma SaaS completa para empresas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <span className="text-sm" style={{ color: 'var(--ink-2)' }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notice */}
      <section className="mx-auto max-w-3xl px-6 pb-24 text-center md:px-12">
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--warning-dim)', border: '1px solid rgba(240,169,64,0.2)' }}
        >
          <p className="text-sm leading-relaxed" style={{ color: 'var(--warning)' }}>
            <strong>Aviso:</strong> O Rekuway Face ID é um MVP funcional. A verificação facial real depende de
            configuração de provedor externo (ex: AWS Rekognition, iProov). Quando não configurado, o sistema informa
            claramente essa limitação sem simular resultados.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center text-xs md:px-12"
        style={{ color: 'var(--subtle)', borderTop: '1px solid var(--border)' }}
      >
        © 2026 Rekuway Security. Rekuway Face ID é um produto independente. Todos os direitos reservados.
      </footer>
    </div>
  )
}
