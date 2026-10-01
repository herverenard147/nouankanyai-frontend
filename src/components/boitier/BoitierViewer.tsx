import { Suspense, lazy, useCallback, useState } from 'react'

import { Boitier2D } from '@/components/boitier/Boitier2D'
import type { BoitierState } from '@/components/boitier/boitierStates'

// La bibliothèque 3D est chargée à la demande : elle n'alourdit ni l'accueil au premier affichage ni le tableau de bord.
const Boitier3D = lazy(() => import('@/components/boitier/Boitier3D'))

interface BoitierViewerProps {
  state: BoitierState
  /** Classes de la zone d'affichage (taille). Le schéma de secours garde sa propre taille. */
  className?: string
}

function webglAvailable(): boolean {
  if (typeof window === 'undefined' || typeof WebGLRenderingContext === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** Boîtier en 3D, ou son schéma 2D si le navigateur ne sait pas faire de WebGL. */
export function BoitierViewer({ state, className }: BoitierViewerProps) {
  const [failed, setFailed] = useState(() => !webglAvailable())
  const onUnavailable = useCallback(() => setFailed(true), [])

  if (failed) return <Boitier2D state={state} />

  return (
    <Suspense fallback={<Boitier2D state={state} />}>
      <Boitier3D state={state} onUnavailable={onUnavailable} className={className} />
    </Suspense>
  )
}
