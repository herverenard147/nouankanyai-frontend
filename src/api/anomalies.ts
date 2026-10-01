import { rawResolutions } from '@/api/rawBackend'
import { formatNumberFr, formatUtcDateTime, NARROW_NBSP } from '@/lib/formatters'
import type { AnomalyResolution, Profile } from '@/types/domain'

/**
 * Historique des « Vérifier et résoudre » : chaque lancement refait un relevé et le compare aux seuils
 * d'alerte (`/api/v1/plan/resolutions`, écrit par `POST /api/machines/{id}/test`). Le relevé est simulé tant
 * qu'aucun appareil n'envoie de mesure : provenance « synthétique ».
 */
export async function fetchResolutions(_profile: Profile): Promise<AnomalyResolution[]> {
  const rows = await rawResolutions()
  return rows.map((row) => {
    const reading = `${formatNumberFr(row.temperature_c ?? 0, 1)}${NARROW_NBSP}°C · ${formatNumberFr(row.vibration_hz ?? 0, 1)}${NARROW_NBSP}Hz`
    return {
      id: row.id,
      date: formatUtcDateTime(row.created_at),
      machineLabel: row.machine_nom ?? row.machine_code,
      resolved: row.resolved,
      resultLabel: row.resolved ? `Résolue : ${reading}, sous les seuils d’alerte` : `L’anomalie persiste : ${reading}`,
      provenance: 'synthetique' as const,
    }
  })
}
