'use client'

import { use, useState, useCallback } from 'react'
import FaceCamera from '@/components/face/FaceCamera'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

type PagePhase = 'consent' | 'camera' | 'processing' | 'result' | 'error'

export default function VerifySessionPage({ params }: PageProps) {
  const { sessionId } = use(params)
  const [phase, setPhase] = useState<PagePhase>('consent')
  const [result, setResult] = useState<{ status: string; message?: string; verificationId?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCapture = useCallback(async ({ frame }: { frame: string }) => {
    setPhase('processing')
    try {
      const res = await fetch(`/api/v1/verify/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: frame, livenessCheck: true, sessionMode: true }),
      })
      const data = await res.json()
      setResult(data)
      setPhase('result')
    } catch {
      setError('Falha ao processar verificação.')
      setPhase('error')
    }
  }, [sessionId])

  return (
    <div className="min-h-dvh bg-[#050505] flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <span className="text-white font-display font-bold text-sm">R</span>
          </div>
          <span className="text-white font-display font-semibold">Rekuway Face ID</span>
        </div>
        <p className="text-white/40 text-xs font-mono tracking-wider uppercase">Sessão {sessionId.slice(0, 8)}...</p>
      </div>

      <div className="w-full max-w-sm">
        {phase === 'consent' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
            <div>
              <h1 className="text-white font-display font-semibold text-xl mb-2">Verificação de Identidade</h1>
              <p className="text-white/60 text-sm font-sans leading-relaxed">
                Esta verificação usa sua câmera para confirmar sua identidade.
                Nenhuma imagem é armazenada após o processamento.
              </p>
            </div>

            <div className="space-y-2">
              {[
                'Câmera frontal será ativada',
                'Processamento local no seu dispositivo',
                'Resultado enviado de forma segura',
                'Dados não são compartilhados com terceiros',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/60">
                  <svg className="w-4 h-4 text-green-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('camera')}
              className="w-full py-3 rounded-xl bg-white text-black font-display font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all"
            >
              Aceitar e continuar
            </button>
            <p className="text-center text-white/25 text-xs font-sans">
              Base legal: legítimo interesse · LGPD Art. 7º
            </p>
          </div>
        )}

        {phase === 'camera' && (
          <div className="space-y-4">
            <h2 className="text-white font-display font-semibold text-center">Posicione seu rosto</h2>
            <FaceCamera onComplete={handleCapture} onError={(e) => { setError(e); setPhase('error') }} />
          </div>
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-5 py-12">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 border-r-blue-400/50 animate-spin" />
              <div className="absolute inset-3 rounded-full border border-white/10 border-t-white/40 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
            </div>
            <div className="text-center">
              <p className="text-white font-sans font-medium">Analisando...</p>
              <p className="text-white/40 text-sm font-sans mt-1">Motor de IA em processamento</p>
            </div>
          </div>
        )}

        {phase === 'result' && result && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              result.status === 'VERIFIED' ? 'bg-green-500/20' : 'bg-yellow-500/20'
            }`}>
              {result.status === 'VERIFIED' ? (
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <div>
              <p className={`font-display font-semibold text-lg ${result.status === 'VERIFIED' ? 'text-green-400' : 'text-yellow-400'}`}>
                {result.status === 'VERIFIED' ? 'Verificado' : 'Inconclusivo'}
              </p>
              {result.message && <p className="text-white/50 text-sm font-sans mt-1">{result.message}</p>}
              {result.verificationId && (
                <p className="text-white/20 text-xs font-mono mt-2">{result.verificationId}</p>
              )}
            </div>
            <p className="text-white/30 text-xs font-sans">Você pode fechar esta janela.</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-3">
            <p className="text-red-400 font-display font-semibold">Erro na verificação</p>
            <p className="text-white/50 text-sm font-sans">{error}</p>
            <button onClick={() => { setError(null); setPhase('camera') }}
              className="text-white/60 text-sm underline hover:text-white transition-colors">
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
