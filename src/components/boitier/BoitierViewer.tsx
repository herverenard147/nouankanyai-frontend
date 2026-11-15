import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'

import { Boitier2D } from '@/components/boitier/Boitier2D'
import type { BoitierState } from '@/components/boitier/boitierStates'

// La bibliothèque 3D (three.js) et le modèle (2,18 Mo) ne sont chargés qu'à l'approche du visualiseur dans la page.
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

/** Écran étroit (mobile) ou économie de données demandée : le schéma 2D suffit, rien de lourd n'est téléchargé. */
function saveBandwidth(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return (
    window.matchMedia('(max-width: 767px)').matches ||
    window.matchMedia('(prefers-reduced-data: reduce)').matches ||
    connection?.saveData === true
  )
}

/** Boîtier en 3D, ou son schéma 2D si le navigateur ne sait pas faire de WebGL, si l'écran est étroit ou en économie de données. */
export function BoitierViewer({ state, className }: BoitierViewerProps) {
  const [failed, setFailed] = useState(() => !webglAvailable() || saveBandwidth())
  const [near, setNear] = useState(false)
  const host = useRef<HTMLDivElement>(null)
  const onUnavailable = useCallback(() => setFailed(true), [])

  useEffect(() => {
    const node = host.current
    if (failed || near || !node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setNear(true)
      },
      { rootMargin: '200px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [failed, near])

  if (failed) return <Boitier2D state={state} />

  return (
    <div ref={host}>
      {near ? (
        <Suspense fallback={<Boitier2D state={state} />}>
          <Boitier3D state={state} onUnavailable={onUnavailable} className={className} />
        </Suspense>
      ) : (
        <Boitier2D state={state} />
      )}
    </div>
  )
}
