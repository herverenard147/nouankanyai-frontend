import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { rawMachines } from '@/api/rawBackend'
import type { MachineRow, Profile } from '@/types/domain'

export async function fetchMachinesTable(_profile: Profile): Promise<{ title: string; rows: MachineRow[] }> {
  const machines = await rawMachines()
  return {
    title: 'Métadonnées machine',
    rows: machines.map((m) => ({
      id: m.machine_id,
      machine: m.nom,
      temperature: `${m.temperature_c} °C`,
      vibration: `${m.vibration_hz} Hz`,
      pression: `${m.pressure_bar} bar`,
      statut: statusLabel(m.status),
      priorite: priorityLabel(m.priority),
      provenance: 'estime' as const,
    })),
  }
}
