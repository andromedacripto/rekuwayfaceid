'use client'

import { useState } from 'react'
import { Camera, ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { VerificationOutcome } from '@/components/face/FaceVerificationModal'

// Load FaceCamera only in browser (WebRTC + TensorFlow.js)
const FaceCamera = dynamic(() => import('@/components/face/FaceCamera'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-sm text-white/50 font-sans">Carregando motor de IA...</p>
    </div>
  ),
})

type PageState = 'intro' | 'verifying' | 'processing' | 'result'

export default function VerifyDemoPage() {
  const [pageState, setPageState] = useState<PageState>('intro')
  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null)

  const handleCapture = async ({ frame }: { frame: string; descriptor: Float32Array }) => {
    setPageState('processing')
    try {
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer demo' },
        body: JSON.stringify({ imageBase64: frame, livenessCheck: true }),
      })
      const data = await res.json()
      setOutcome({
        status: data.status ?? 'INCONCLUSIVE',
        verificationId: data.verificationId ?? '',
        message: data.message ?? '',
      } as VerificationOutcome)
    } catch {
      setOutcome({ status: 'ERROR', message: 'Falha ao processar' })
    }
    setPageState('result')
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--bg-gradient)' }}>
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-black text-base bg-white">
          R
        </div>
        <span className="font-display font-semibold text-white text-sm tracking-tight">
          Rekuway <span className="text-white/40">Face ID</span>
        </span>
      </div>

      <div className="w-full max-w-sm rounded-3xl overflow-hidden border border-white/8 bg-white/4">
        {pageState === 'intro' && (
          <div className="p-6 flex flex-col items-center gap-5 py-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/8 border border-white/10">
              <Camera className="w-7 h-7 text-white/80" />
            </div>
            <div className="text-center">
              <h1 className="font-display text-xl font-semibold text-white">Verificação Facial</h1>
              <p className="text-sm text-white/50 font-sans mt-2 leading-relaxed text-pretty">
                Demonstração da tecnologia de reconhecimento facial com prova de vida.
              </p>
            </div>
            <div className="w-full space-y-2">
              {['Câmera do dispositivo', 'Prova de vida via piscada + movimento', 'IA 100% local no dispositivo'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-white/40 font-sans">
                  <div className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <button onClick={() => setPageState('verifying')}
              className="w-full py-3.5 rounded-xl font-sans font-semibold text-black text-sm bg-white hover:bg-white/90 transition-all active:scale-95">
              Iniciar Verificação
            </button>
            <p className="text-xs text-white/25 font-sans text-center">
              Ao continuar, você consente com o processamento local da sua imagem.
            </p>
          </div>
        )}

        {pageState === 'verifying' && (
          <div className="p-6">
            <h1 className="font-display text-lg font-semibold text-white mb-1">Verificação Facial</h1>
            <p className="text-xs text-white/50 font-sans mb-4">Pisque os olhos e mova levemente a cabeça.</p>
            <FaceCamera onComplete={handleCapture} onError={() => setPageState('intro')} />
          </div>
        )}

        {pageState === 'processing' && (
          <div className="flex flex-col items-center gap-5 py-16 px-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
            </div>
            <p className="text-white font-sans">Analisando identidade...</p>
          </div>
        )}

        {pageState === 'result' && outcome && (
          <div className="p-6 flex flex-col items-center gap-5 py-8">
            {outcome.status === 'VERIFIED' && <ShieldCheck className="w-14 h-14 text-green-400" />}
            {outcome.status === 'REFUSED' && <ShieldX className="w-14 h-14 text-red-400" />}
            {(outcome.status === 'INCONCLUSIVE' || outcome.status === 'ERROR') && <ShieldAlert className="w-14 h-14 text-yellow-400" />}
            <div className="text-center">
              <p className={`font-display text-xl font-semibold ${
                outcome.status === 'VERIFIED' ? 'text-green-400' :
                outcome.status === 'REFUSED' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {outcome.status === 'VERIFIED' ? 'Verificado' :
                 outcome.status === 'REFUSED' ? 'Recusado' : 'Inconclusivo'}
              </p>
              {'message' in outcome && outcome.message && (
                <p className="text-sm text-white/40 font-sans mt-1">{outcome.message}</p>
              )}
            </div>
            <button onClick={() => { setOutcome(null); setPageState('intro') }}
              className="w-full py-3 rounded-xl border border-white/10 text-white/60 text-sm font-sans hover:bg-white/5 transition-colors">
              Testar novamente
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-xs text-white/20 font-sans text-center max-w-xs">
        Demonstração pública do Rekuway Face ID. Verificação ocorre localmente.
      </p>
    </main>
  )
}
