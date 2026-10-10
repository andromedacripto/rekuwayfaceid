'use client'

import { useCallback, useState } from 'react'
import { loadModels, detectFace, compareFaces } from '@/lib/face-engine'
import type { ComparisonResult } from '@/lib/face-engine'

export interface ComparisonState {
  loading: boolean
  result: ComparisonResult | null
  error: string | null
}

export function useFaceComparison() {
  const [state, setState] = useState<ComparisonState>({ loading: false, result: null, error: null })

  const compare = useCallback(async (
    liveImageEl: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    referenceBase64: string,
  ): Promise<ComparisonResult | null> => {
    setState({ loading: true, result: null, error: null })
    try {
      await loadModels()

      // Detect live face
      const liveDetection = await detectFace(liveImageEl)
      if (!liveDetection.detected || !liveDetection.descriptor) {
        throw new Error('Nenhum rosto detectado na imagem ao vivo')
      }

      // Load reference image from base64
      const refImg = await loadBase64Image(referenceBase64)
      const refDetection = await detectFace(refImg)
      if (!refDetection.detected || !refDetection.descriptor) {
        throw new Error('Nenhum rosto detectado na imagem de referência')
      }

      const result = compareFaces(liveDetection.descriptor, refDetection.descriptor)
      setState({ loading: false, result, error: null })
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState({ loading: false, result: null, error: msg })
      return null
    }
  }, [])

  return { ...state, compare }
}

function loadBase64Image(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    // Accept with or without data URI prefix
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
  })
}
