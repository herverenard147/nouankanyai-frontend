import { boitierState } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'

interface Boitier2DProps {
  state: BoitierState
  className?: string
}

/**
 * Image fixe du prototype (rendu 3D du boîtier fermé, 2026-10-15) : sert pendant le chargement de la 3D et quand le
 * navigateur ne sait pas faire de WebGL. Avant, c'était un schéma de l'ancien boîtier rectangulaire, qui apparaissait
 * un instant au chargement. L'état choisi reste dit dans l'étiquette et dans le texte à côté.
 */
export function Boitier2D({ state, className }: Boitier2DProps) {
  const { label } = boitierState(state)

  return (
    <div
      role="img"
      aria-label={`Schéma du boîtier Nouankany : le prototype, lumière « ${label} »`}
      className={`mx-auto flex aspect-[4/3] w-full flex-col items-center justify-center ${className ?? ''}`}
    >
      <img src="/images/boitier-prototype.webp" alt="" width={355} height={346} className="h-auto w-[55%] max-w-[300px]" />
    </div>
  )
}
