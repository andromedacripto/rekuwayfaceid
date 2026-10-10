'use client'

import { useCallback, useState } from 'react'
import FaceCamera from './FaceCamera'

export type VerificationOutcome =
  | { status: 'VERIFIED'; verificationId: string; matchScore?: number }
  | { status: 'INCONCLUSIVE'; verificationId: string; message: string }
  | { status: 'REFUSED'; verificationId: string; reason: string }
  | { status: 'ERROR'; message: string }

interface FaceVerificationModalProps {
  open: boolean
  onClose: () => void
  onResult: (outcome: VerificationOutcome) => void
  apiKey: string          // rfid_sandbox_... key to call the v1 API
  apiBaseUrl?: string     // defaults to same origin
  referenceBase64?: string
  title?: string
  description?: string
}

type ModalPhase = 'camera' | 'processing' | 'result'

export default function FaceVerificationModal({
  open,
  onClose,
  onResult,
  apiKey,
  apiBaseUrl = '',
  referenceBase64,
  title = 'Verificação Facial',
  description = 'Precisamos confirmar sua identidade. Olhe para a câmera e pisque os olhos.',
}: FaceVerificationModalProps) {
  const [phase, setPhase] = useState<ModalPhase>('camera')
  const [outcome, setOutcome] = useState<VerificationOutcome | null>(null)

  const handleCapture = useCallback(async ({ frame }: { frame: string }) => {
    setPhase('processing')
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          imageBase64: frame,
          referenceBase64: referenceBase64 ?? undefined,
          livenessCheck: true,
        }),
      })
      const data = await res.json()

      let result: VerificationOutcome
      if (!res.ok) {
        result = { status: 'ERROR', message: data.error?.message ?? 'Erro na verificação' }
      } else {
        result = {
          status: data.status as VerificationOutcome['status'],
          verificationId: data.verificationId,
          message: data.message,
        } as VerificationOutcome
      }

      setOutcome(result)
      setPhase('result')
      onResult(result)
    } catch {
      const result: VerificationOutcome = { status: 'ERROR', message: 'Falha ao enviar verificação' }
      setOutcome(result)
      setPhase('result')
      onResult(result)
    }
  }, [apiKey, apiBaseUrl, referenceBase64, onResult])

  const handleReset = () => {
    setPhase('camera')
    setOutcome(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* R logo */}
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
                <span className="text-white font-display font-bold text-xs">R</span>
              </div>
              <span className="text-white/50 text-xs font-sans tracking-widest uppercase">Rekuway Face ID</span>
            </div>
            <h2 className="text-white font-display font-semibold text-lg">{title}</h2>
            <p className="text-white/50 text-sm font-sans mt-0.5">{description}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors p-1 -mt-1 -mr-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {phase === 'camera' && (
          <FaceCamera onComplete={handleCapture} onError={(e) => { setOutcome({ status: 'ERROR', message: e }); setPhase('result') }} />
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-white/10" />
              <div className="absolute inset-0 rounded-full border-2 border-t-blue-400 animate-spin" />
            </div>
            <p className="text-white/70 font-sans text-sm">Analisando identidade...</p>
            <p className="text-white/30 font-sans text-xs text-center">Motor de IA em processamento</p>
          </div>
        )}

        {phase === 'result' && outcome && (
          <ResultView outcome={outcome} onRetry={handleReset} onClose={onClose} />
        )}

        {/* Footer */}
        <p className="text-center text-white/20 text-xs font-sans mt-4">
          Dados biométricos processados localmente · Rekuway Security
        </p>
      </div>
    </div>
  )
}

function ResultView({
  outcome,
  onRetry,
  onClose,
}: {
  outcome: VerificationOutcome
  onRetry: () => void
  onClose: () => void
}) {
  const isVerified = outcome.status === 'VERIFIED'
  const isRefused = outcome.status === 'REFUSED'

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Icon */}
      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
        isVerified ? 'bg-green-500/20' : isRefused ? 'bg-red-500/20' : 'bg-yellow-500/20'
      }`}>
        {isVerified ? (
          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ) : isRefused ? (
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.193 2.5 1.732 2.5z" />
          </svg>
        )}
      </div>

      {/* Status */}
      <div className="text-center">
        <p className={`font-display font-semibold text-lg ${
          isVerified ? 'text-green-400' : isRefused ? 'text-red-400' : 'text-yellow-400'
        }`}>
          {isVerified ? 'Identidade Verificada' : isRefused ? 'Verificação Recusada' : 'Inconclusivo'}
        </p>
        <p className="text-white/50 text-sm font-sans mt-1">
          {outcome.status === 'VERIFIED' && 'Sua identidade foi confirmada com sucesso.'}
          {outcome.status === 'REFUSED' && 'Não foi possível confirmar a identidade.'}
          {outcome.status === 'INCONCLUSIVE' && (outcome as {message?: string}).message}
          {outcome.status === 'ERROR' && (outcome as {message?: string}).message}
        </p>
        {'verificationId' in outcome && (
          <p className="text-white/20 text-xs font-mono mt-2">{(outcome as {verificationId: string}).verificationId}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full mt-2">
        {!isVerified && (
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm font-sans hover:bg-white/5 transition-colors"
          >
            Tentar novamente
          </button>
        )}
        <button
          onClick={onClose}
          className={`${isVerified ? 'flex-1' : ''} py-2.5 px-4 rounded-xl bg-white text-black text-sm font-sans font-semibold hover:bg-white/90 transition-colors`}
        >
          {isVerified ? 'Continuar' : 'Fechar'}
        </button>
      </div>
    </div>
  )
}
