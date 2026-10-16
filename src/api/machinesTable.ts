import { priorityLabel, statusLabel } from '@/api/backendHelpers'
import { getCachedMachines, getCachedRecommend, hasReading } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { MachineRow, Profile } from '@/types/domain'

/** « - » pour une machine sans relevé : aucune valeur inventée. */
function reading(value: number | null, unit: string): string {
  return value === null ? '-' : `${formatNumberFr(value, 1)} ${unit}`
}

export async function fetchMachinesTable(_profile: Profile): Promise<{ title: string; rows: MachineRow[] }> {
  const machines = await getCachedMachines()
  // Statut cohérent avec Alertes : une machine dont le diagnostic a franchi un seuil est « Anomalie détectée »,
  // même si son statut enregistré est encore « actif » (avant, elle restait « Opérationnel » dans ce tableau).
  const measured = machines.filter(hasReading)
  const alerted = new Set(
    measured.length === 0
      ? []
      : (await getCachedRecommend(measured).catch(() => ({ recommendations: [] }))).recommendations
          .filter((rec) => rec.type === 'alerte')
          .map((rec) => rec.machine_id),
  )
  return {
    title: 'Machines suivies',
    rows: machines.map((m) => ({
      id: m.machine_id,
      machine: m.nom,
      puissance: hasReading(m) ? reading(m.power_kw, 'kW') : '-',
      temperature: reading(m.temperature_c, '°C'),
      vibration: reading(m.vibration_mm_s, 'mm/s'),
      pression: reading(m.pressure_bar, 'bar'),
      attendu: m.estimation_reference
        ? `≈ ${formatNumberFr(m.estimation_reference.kwh_jour, 1)} kWh, ${formatNumberFr(m.estimation_reference.cout_jour_fcfa, 0)} FCFA (estimé)`
        : '-',
      statut: alerted.has(m.machine_id) ? statusLabel('alerte') : statusLabel(m.status),
      priorite: priorityLabel(m.priority),
      // Les relevés sont simulés côté backend (aucun capteur branché) : jamais présentés comme "estimés".
      provenance: 'synthetique' as const,
      photo_data_url: m.photo_data_url ?? null,
    })),
  }
}
