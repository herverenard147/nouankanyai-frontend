import { clsx } from 'clsx'

import type { Provenance } from '@/types/domain'

const PROVENANCE_LABEL: Record<Provenance, string> = {
  mesure: 'mesuré',
  estime: 'estimé',
  synthetique: 'synthétique',
  telemetrie_systeme: 'télémétrie système',
}

const PROVENANCE_CLASSES: Record<Provenance, string> = {
  mesure: 'bg-confirm-bg text-confirm',
  estime: 'bg-badge-estime-bg text-badge-estime-text',
  synthetique: 'bg-badge-synth-bg text-badge-synth-text',
  telemetrie_systeme: 'bg-badge-synth-bg text-badge-synth-text',
}

interface ProvenanceBadgeProps {
  value: Provenance
  className?: string
}

/**
 * Une donnée est mesurée, estimée, ou synthétique, jamais inventée.
 * Toujours appelé avec le champ `provenance` d'un item de donnée, jamais une
 * valeur littérale codée dans le JSX.
 */
export function ProvenanceBadge({ value, className }: ProvenanceBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-mono text-mono-badge font-semibold',
        PROVENANCE_CLASSES[value],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {PROVENANCE_LABEL[value]}
    </span>
  )
}
