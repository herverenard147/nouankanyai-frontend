import { rawAssistantChat, getCachedMachines } from '@/api/rawBackend'
import type { Profile } from '@/types/domain'

export async function fetchAssistantContext(_profile: Profile): Promise<{ context: string; machineCount: number }> {
  const machines = await getCachedMachines()
  const label = machines.length > 0 ? machines.slice(0, 3).map((m) => m.nom).join(', ') : 'aucun équipement enregistré'
  return { context: label, machineCount: machines.length }
}

/**
 * /api/v1/assistant/chat (IndustrialCopilot) plutôt que l'ancien /api/chat :
 * mémoire conversationnelle multi-tours tenue côté backend (par session_id,
 * qu'on laisse volontairement par défaut à "user:{owner_id}" — pas besoin
 * de la gérer côté client) et contexte machines/alertes chargé depuis la
 * vraie base, pas un résumé texte statique reconstruit ici.
 */
export async function sendAssistantMessage(_profile: Profile, message: string): Promise<string> {
  const { response } = await rawAssistantChat(message)
  return response
}
