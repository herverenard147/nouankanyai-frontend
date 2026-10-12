/**
 * Couleur de l'étiquette d'impact d'un conseil : un gain chiffré est un
 * bénéfice (vert) ; à défaut de gain le backend renvoie la sévérité du
 * problème, qui ne doit jamais s'afficher dans la couleur d'un gain.
 */
/**
 * Couleur d'une alerte selon sa sévérité : le rouge est réservé au critique. Une alerte faible qui
 * demande quand même un geste reste lisible sans crier (retour du propriétaire, 2026-10-12).
 */
export function alertTone(severity: string): { text: string; bar: string } {
  const level = severity.trim().toLowerCase()
  if (level.startsWith('crit')) return { text: 'text-alert', bar: 'bg-alert' }
  if (level.startsWith('mod')) return { text: 'text-accent-cta', bar: 'bg-accent' }
  return { text: 'text-text-secondary', bar: 'bg-text-tertiary' }
}

export function impactClassName(kind: 'gain' | 'severity', label: string): string {
  if (kind === 'gain') return 'text-confirm'
  return label.trim().toLowerCase().startsWith('crit') ? 'text-alert' : 'text-text-secondary'
}
