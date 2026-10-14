export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function priorityLabel(priority: string): 'Haute' | 'Moyenne' | 'Basse' {
  const map: Record<string, 'Haute' | 'Moyenne' | 'Basse'> = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' }
  return map[priority.toLowerCase()] ?? 'Moyenne'
}

const STATUS_LABEL: Record<string, string> = { actif: 'Opérationnel', alerte: 'Anomalie détectée', arrete: 'Éteint' }

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? capitalize(status)
}
