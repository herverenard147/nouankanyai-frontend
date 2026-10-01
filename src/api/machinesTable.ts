import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { getCachedMachines } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { MachineRow, Profile } from '@/types/domain'

export async function fetchMachinesTable(_profile: Profile): Promise<{ title: string; rows: MachineRow[] }> {
  const machines = await getCachedMachines()
  return {
    title: 'Machines suivies',
    rows: machines.map((m) => ({
      id: m.machine_id,
      machine: m.nom,
      temperature: `${formatNumberFr(m.temperature_c, 1)} °C`,
      vibration: `${formatNumberFr(m.vibration_hz, 1)} Hz`,
      pression: `${formatNumberFr(m.pressure_bar, 1)} bar`,
      statut: statusLabel(m.status),
      priorite: priorityLabel(m.priority),
      // Les relevés température/vibration/pression sont simulés côté backend
      // (aucun capteur branché) : jamais présentés comme "estimés".
      provenance: 'synthetique' as const,
    })),
  }
}
