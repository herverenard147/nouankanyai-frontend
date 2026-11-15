import { impactClassName } from '@/lib/severity'
import type { Advice } from '@/types/domain'

/** Chiffre d'impact d'un conseil. Un gain en FCFA sort du moteur de recommandation, sans source vérifiable : il est donné comme ordre de grandeur. */
export function ImpactFigure({ advice }: { advice: Pick<Advice, 'impactKind' | 'impactLabel'> }) {
  return (
    <span className="flex flex-col items-end">
      <span className={`text-lg font-semibold tabular-nums ${impactClassName(advice.impactKind, advice.impactLabel)}`}>{advice.impactLabel}</span>
      {advice.impactKind === 'gain' && <span className="text-xs text-text-secondary">ordre de grandeur</span>}
    </span>
  )
}
