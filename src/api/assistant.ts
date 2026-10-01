import { rawChat, getCachedMachines } from '@/api/rawBackend'
import type { Profile } from '@/types/domain'

export async function fetchAssistantContext(_profile: Profile): Promise<{ context: string; machineCount: number }> {
  const machines = await getCachedMachines()
  const label = machines.length > 0 ? machines.slice(0, 3).map((m) => m.nom).join(', ') : 'aucun équipement enregistré'
  return { context: label, machineCount: machines.length }
}

export async function sendAssistantMessage(_profile: Profile, message: string): Promise<string> {
  const machines = await getCachedMachines()
  const { response } = await rawChat(message, machines)
  return response
}
