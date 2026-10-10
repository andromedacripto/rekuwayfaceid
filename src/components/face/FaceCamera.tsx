'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useFaceDetection } from '@/hooks/useFaceDetection'
import type { VerificationPhase } from '@/hooks/useFaceDetection'

interface FaceCameraProps {
  onComplete: (result: { frame: string; descriptor: Float32Array }) => void
  onError?: (err: string) => void
  referenceDescriptor?: Float32Array
  autoStart?: boolean
}

const PHASE_MESSAGES: Record<VerificationPhase, string> = {
  idle: 'Pronto para iniciar',
  loading_models: 'Carregando IA...',
  requesting_camera: 'Solicitando câmera...',
  no_face: 'Centralize seu rosto',
  face_detected: 'Rosto detectado',
  liveness_collecting: 'Pisque os olhos e mova a cabeça',
  liveness_passed: 'Verificado!',
  liveness_failed: 'Tente novamente',
  capturing: 'Capturando...',
  done: 'Concluído',
  error: 'Erro',
}

const PHASE_COLORS: Partial<Record<VerificationPhase, string>> = {
  face_detected: '#22c55e',
  liveness_collecting: '#3b82f6',
  liveness_passed: '#22c55e',
  done: '#22c55e',
  liveness_failed: '#ef4444',
  no_face: '#f59e0b',
  error: '#ef4444',
}

export default function FaceCamera({ onComplete, onError, autoStart = true }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state, start, stop } = useFaceDetection(videoRef)

  // Auto-start
  useEffect(() => {
    if (autoStart) start()
    return () => stop()
  }, [autoStart, start, stop])

  // Fire completion callback
  useEffect(() => {
    if (state.phase === 'done' && state.capturedFrame && state.capturedDescriptor) {
      onComplete({ frame: state.capturedFrame, descriptor: state.capturedDescriptor })
    }
    if (state.phase === 'error' && state.error && onError) {
      onError(state.error)
    }
  }, [state.phase, state.capturedFrame, state.capturedDescriptor, state.error, onComplete, onError])

  // Draw overlay on canvas
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || video.videoWidth === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const { detection, phase } = state
    const color = PHASE_COLORS[phase] ?? 'rgba(255,255,255,0.6)'

    // Oval face guide
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const rx = canvas.width * 0.22
    const ry = canvas.height * 0.35

    ctx.save()
    // Dim outside oval
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
    ctx.restore()

    // Oval border
    const progress = state.progress / 100
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    // Full oval base
    ctx.globalAlpha = 0.35
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
    // Progress arc
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, -Math.PI / 2, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
    ctx.stroke()
    ctx.restore()

    // Corner brackets on bounding box when face detected
    if (detection?.detected && detection.box) {
      const { x, y, width, height } = detection.box
      const bw = 20
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.shadowColor = color
      ctx.shadowBlur = 8

      // Top-left
      ctx.beginPath(); ctx.moveTo(x, y + bw); ctx.lineTo(x, y); ctx.lineTo(x + bw, y); ctx.stroke()
      // Top-right
      ctx.beginPath(); ctx.moveTo(x + width - bw, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width, y + bw); ctx.stroke()
      // Bottom-left
      ctx.beginPath(); ctx.moveTo(x, y + height - bw); ctx.lineTo(x, y + height); ctx.lineTo(x + bw, y + height); ctx.stroke()
      // Bottom-right
      ctx.beginPath(); ctx.moveTo(x + width - bw, y + height); ctx.lineTo(x + width, y + height); ctx.lineTo(x + width, y + height - bw); ctx.stroke()
    }

    // Landmark dots
    if (detection?.landmarks?.positions) {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      for (const pt of detection.landmarks.positions) {
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }
  }, [state])

  // Continuous overlay render loop
  useEffect(() => {
    let raf: number
    const loop = () => { drawOverlay(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [drawOverlay])

  const phase = state.phase
  const color = PHASE_COLORS[phase] ?? '#ffffff'
  const isDone = phase === 'done' || phase === 'liveness_passed'
  const isFail = phase === 'liveness_failed' || phase === 'error'

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Camera viewport */}
      <div className="relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
        />

        {/* Loading overlay */}
        {(phase === 'loading_models' || phase === 'requesting_camera') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white/80 text-sm font-sans">{state.message}</p>
          </div>
        )}

        {/* Done flash */}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 animate-pulse pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-green-500/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Expression / age badge */}
        {state.detection?.detected && state.detection.age && phase === 'liveness_collecting' && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white/70 font-mono">
            {state.detection.gender === 'male' ? 'M' : 'F'} · {Math.round(state.detection.age ?? 0)}a
          </div>
        )}

        {/* Score badge */}
        {state.detection?.score && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-mono"
            style={{ color }}>
            {Math.round((state.detection.score ?? 0) * 100)}%
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="w-full max-w-sm space-y-2">
        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${state.progress}%`, backgroundColor: color }}
          />
        </div>

        {/* Message */}
        <p className="text-center text-sm font-sans transition-all duration-300" style={{ color }}>
          {PHASE_MESSAGES[phase]}
        </p>

        {/* Liveness indicators */}
        {state.liveness && (
          <div className="flex justify-center gap-4 text-xs font-sans">
            <LivenessIndicator label="Piscada" ok={state.liveness.eyeBlinkDetected} />
            <LivenessIndicator label="Movimento" ok={state.liveness.headMovementDetected} />
            <LivenessIndicator label="Profundidade" ok={state.liveness.depthCuePass} />
          </div>
        )}

        {/* Retry button */}
        {isFail && (
          <button
            onClick={() => start()}
            className="w-full py-2 rounded-xl border border-white/20 text-white/80 text-sm hover:bg-white/10 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}

function LivenessIndicator({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`flex items-center gap-1 ${ok ? 'text-green-400' : 'text-white/40'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400' : 'bg-white/20'}`} />
      {label}
    </span>
  )
}
