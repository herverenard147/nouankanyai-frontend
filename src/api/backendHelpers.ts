export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function priorityLabel(priority: string): 'Haute' | 'Moyenne' | 'Basse' {
  const map: Record<string, 'Haute' | 'Moyenne' | 'Basse'> = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' }
  return map[priority.toLowerCase()] ?? 'Moyenne'
}

export function statusLabel(status: string): string {
  return status === 'actif' ? 'Opérationnel' : status === 'alerte' ? 'Anomalie détectée' : capitalize(status)
}
