'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { loadModels, detectFace, analyzeLiveness, captureFrame } from '@/lib/face-engine'
import type { DetectionResult, LivenessSignals } from '@/lib/face-engine'

export type VerificationPhase =
  | 'idle'
  | 'loading_models'
  | 'requesting_camera'
  | 'no_face'
  | 'face_detected'
  | 'liveness_collecting'
  | 'liveness_passed'
  | 'liveness_failed'
  | 'capturing'
  | 'done'
  | 'error'

export interface FaceDetectionState {
  phase: VerificationPhase
  detection: DetectionResult | null
  liveness: LivenessSignals | null
  capturedFrame: string | null   // base64 JPEG
  capturedDescriptor: Float32Array | null
  progress: number               // 0–100
  message: string
  error: string | null
}

const LIVENESS_FRAMES = 90      // ~3 seconds at 30fps
const LIVENESS_INTERVAL_MS = 33 // ~30fps

export function useFaceDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [state, setState] = useState<FaceDetectionState>({
    phase: 'idle',
    detection: null,
    liveness: null,
    capturedFrame: null,
    capturedDescriptor: null,
    progress: 0,
    message: 'Aguardando início',
    error: null,
  })

  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const framesRef = useRef<DetectionResult[]>([])
  const activeRef = useRef(false)

  const setPhase = useCallback((phase: VerificationPhase, message: string, extra?: Partial<FaceDetectionState>) => {
    setState((s) => ({ ...s, phase, message, ...extra }))
  }, [])

  const stop = useCallback(() => {
    activeRef.current = false
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    if (activeRef.current) return
    activeRef.current = true
    framesRef.current = []

    try {
      // 1. Load models
      setPhase('loading_models', 'Carregando modelos de IA...')
      await loadModels()

      // 2. Request camera
      setPhase('requesting_camera', 'Solicitando acesso à câmera...')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user', frameRate: { ideal: 30 } },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise<void>((res) => {
          if (!videoRef.current) return res()
          videoRef.current.onloadedmetadata = () => res()
        })
        await videoRef.current.play()
      }

      if (!activeRef.current) return

      // 3. Liveness collection loop
      setPhase('liveness_collecting', 'Olhe para a câmera e pisque os olhos')
      let frameCount = 0

      timerRef.current = setInterval(async () => {
        if (!activeRef.current || !videoRef.current) return

        const result = await detectFace(videoRef.current)
        setState((s) => ({ ...s, detection: result }))

        if (result.detected) {
          framesRef.current.push(result)
          frameCount++
          const progress = Math.min(100, Math.round((frameCount / LIVENESS_FRAMES) * 100))
          setState((s) => ({ ...s, progress, phase: 'liveness_collecting' }))

          // Update guidance message dynamically
          const lv = analyzeLiveness(framesRef.current, { requiredBlinks: 1, requiredMovementPx: 10 })
          let msg = 'Pisque os olhos'
          if (lv.eyeBlinkDetected && !lv.headMovementDetected) msg = 'Mova levemente a cabeça'
          else if (lv.eyeBlinkDetected && lv.headMovementDetected) msg = 'Perfeito! Aguarde...'
          setState((s) => ({ ...s, message: msg }))

          if (frameCount >= LIVENESS_FRAMES) {
            clearInterval(timerRef.current!)
            timerRef.current = null

            const liveness = analyzeLiveness(framesRef.current, { requiredBlinks: 1, requiredMovementPx: 10 })
            setState((s) => ({ ...s, liveness }))

            if (liveness.score >= 0.55) {
              setPhase('capturing', 'Capturando rosto...', { progress: 100 })
              // Pick best frame (highest detection score)
              const best = framesRef.current.reduce((a, b) => (b.score ?? 0) > (a.score ?? 0) ? b : a)
              const frame = captureFrame(videoRef.current!)
              setPhase('liveness_passed', 'Prova de vida confirmada!', {
                capturedFrame: frame,
                capturedDescriptor: best.descriptor ?? null,
                phase: 'done',
                progress: 100,
              })
              stop()
            } else {
              setPhase('liveness_failed', 'Prova de vida não confirmada. Tente novamente.', { progress: 0 })
              framesRef.current = []
              frameCount = 0
              // Retry automatically after 2s
              setTimeout(() => {
                if (activeRef.current) {
                  framesRef.current = []
                  setState((s) => ({ ...s, phase: 'liveness_collecting', progress: 0, message: 'Pisque os olhos' }))
                }
              }, 2000)
            }
          }
        } else {
          setState((s) => ({ ...s, phase: 'no_face', message: 'Nenhum rosto detectado — centralize o rosto' }))
        }
      }, LIVENESS_INTERVAL_MS)

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setPhase('error', 'Erro ao acessar câmera', { error: msg })
    }
  }, [videoRef, setPhase, stop])

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop])

  return { state, start, stop }
}
