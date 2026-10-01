import { boitierState } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'

interface Boitier2DProps {
  state: BoitierState
  className?: string
}

const GRILLE = Array.from({ length: 27 }, (_, i) => i)

/** Schéma de secours (sans WebGL) : même boîtier, vu de face, dessiné en CSS. */
export function Boitier2D({ state, className }: Boitier2DProps) {
  const { led } = boitierState(state)

  return (
    <div
      role="img"
      aria-label="Schéma du boîtier Nouankany, vu de face"
      className={`mx-auto flex aspect-[2/1] w-full max-w-[340px] flex-col items-center justify-center gap-7 rounded-[26px] bg-[#2b261e] ${className ?? ''}`}
    >
      <div
        className="h-4 w-[70%] rounded-full transition-colors duration-300"
        style={{ backgroundColor: led, boxShadow: `0 0 36px 6px ${led}88` }}
      />
      <div className="grid grid-cols-9 gap-2" aria-hidden="true">
        {GRILLE.map((i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full bg-[#15120e]" />
        ))}
      </div>
    </div>
  )
}
