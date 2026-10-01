import { clsx } from 'clsx'

import type { Provenance } from '@/types/domain'

const PROVENANCE_LABEL: Record<Provenance, string> = {
  mesure: 'Mesuré',
  estime: 'Estimé',
  synthetique: 'Synthétique',
  telemetrie_systeme: 'Télémétrie système',
}

interface ProvenanceBadgeProps {
  value: Provenance
  className?: string
}

/**
 * Une donnée est mesurée, estimée, ou synthétique, jamais inventée. Rendu sobre (DESIGN.md règle 2) : texte
 * gris discret en police normale, sans pastille ni couleur — la provenance reste visible sans ressembler à une
 * étiquette décorative. Toujours appelé avec le champ `provenance` d'un item de donnée, jamais une valeur
 * littérale codée dans le JSX.
 */
export function ProvenanceBadge({ value, className }: ProvenanceBadgeProps) {
  return <span className={clsx('whitespace-nowrap text-xs text-text-secondary', className)}>{PROVENANCE_LABEL[value]}</span>
}
