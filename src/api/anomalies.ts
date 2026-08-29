import { priorityLabel } from '@/api/backendHelpers'
import { rawMachines } from '@/api/rawBackend'
import type { AnomalyResolution, MachineRow, Profile } from '@/types/domain'

export async function fetchOpenAnomalies(_profile: Profile): Promise<MachineRow[]> {
  const machines = await rawMachines()
  return machines
    .filter((m) => m.status === 'alerte')
    .map((m) => ({
      id: m.machine_id,
      machine: m.nom,
      temperature: `${m.temperature_c} °C`,
      vibration: `${m.vibration_hz} Hz`,
      pression: `${m.pressure_bar} bar`,
      statut: 'Anomalie détectée',
      priorite: priorityLabel(m.priority),
      provenance: 'estime' as const,
    }))
}

/**
 * Le backend n'a pas de mécanisme qui marque une AIAlert comme résolue
 * (`is_resolved` reste toujours `false`) : pas d'historique de résolutions à
 * afficher honnêtement aujourd'hui. Renvoie une liste vide plutôt qu'une
 * donnée inventée — `MetricState` affiche l'état vide, pas une erreur.
 */
export async function fetchResolutions(_profile: Profile): Promise<AnomalyResolution[]> {
  return []
}
