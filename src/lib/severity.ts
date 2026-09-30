/**
 * Couleur de l'étiquette d'impact d'un conseil : un gain chiffré est un
 * bénéfice (vert) ; à défaut de gain le backend renvoie la sévérité du
 * problème, qui ne doit jamais s'afficher dans la couleur d'un gain.
 */
export function impactClassName(kind: 'gain' | 'severity', label: string): string {
  if (kind === 'gain') return 'text-confirm'
  return label.trim().toLowerCase().startsWith('crit') ? 'text-alert' : 'text-text-secondary'
}
