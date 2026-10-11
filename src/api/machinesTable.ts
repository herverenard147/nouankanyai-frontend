import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { getCachedMachines } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { MachineRow, Profile } from '@/types/domain'

/** « — » pour une machine sans relevé : aucune valeur inventée. */
function reading(value: number | null, unit: string): string {
  return value === null ? '—' : `${formatNumberFr(value, 1)} ${unit}`
}

export async function fetchMachinesTable(_profile: Profile): Promise<{ title: string; rows: MachineRow[] }> {
  const machines = await getCachedMachines()
  return {
    title: 'Machines suivies',
    rows: machines.map((m) => ({
      id: m.machine_id,
      machine: m.nom,
      temperature: reading(m.temperature_c, '°C'),
      vibration: reading(m.vibration_hz, 'Hz'),
      pression: reading(m.pressure_bar, 'bar'),
      attendu: m.estimation_reference
        ? `≈ ${formatNumberFr(m.estimation_reference.kwh_jour, 1)} kWh, ${formatNumberFr(m.estimation_reference.cout_jour_fcfa, 0)} FCFA (estimé)`
        : '—',
      statut: statusLabel(m.status),
      priorite: priorityLabel(m.priority),
      // Les relevés température/vibration/pression sont simulés côté backend
      // (aucun capteur branché) : jamais présentés comme "estimés".
      provenance: 'synthetique' as const,
      photo_data_url: m.photo_data_url ?? null,
    })),
  }
}
