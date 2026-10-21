import { Minus, Plus } from 'lucide-react'
import { useRef, useState } from 'react'

const STEPS = [1, 1.5, 2, 3, 4]

/**
 * Justificatif lisible (demande du propriétaire, 2026-10-21) : boutons « − » et « + » jusqu'à 4 fois, image qui défile
 * dans son cadre, et glisser pour se déplacer quand elle est agrandie.
 */
export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [step, setStep] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const zoom = STEPS[step]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2" role="group" aria-label="Zoom">
        <button type="button" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-control border border-border disabled:opacity-40"
          aria-label="Réduire" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-14 text-center text-sm tabular-nums text-text-secondary" aria-live="polite">{Math.round(zoom * 100)} %</span>
        <button type="button" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-control border border-border disabled:opacity-40"
          aria-label="Agrandir" disabled={step === STEPS.length - 1} onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        {step > 0 && (
          <button type="button" className="focus-ring text-sm font-semibold text-accent-cta hover:underline" onClick={() => setStep(0)}>
            Taille d’origine
          </button>
        )}
      </div>
      <div
        ref={box}
        className={`max-h-[70vh] overflow-auto rounded-control border border-border ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onPointerDown={(e) => {
          if (zoom === 1 || !box.current) return
          drag.current = { x: e.clientX, y: e.clientY, left: box.current.scrollLeft, top: box.current.scrollTop }
        }}
        onPointerMove={(e) => {
          if (!drag.current || !box.current) return
          box.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x)
          box.current.scrollTop = drag.current.top - (e.clientY - drag.current.y)
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        <img src={src} alt={alt} draggable={false} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} className="block select-none" />
      </div>
    </div>
  )
}
