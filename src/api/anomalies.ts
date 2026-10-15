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
    // Seulement les mesures que l'appareil a (souvent aucune température ni vibration : capteur électrique seul).
    const parts: string[] = []
    if (row.temperature_c !== null && row.temperature_c !== undefined) parts.push(`${formatNumberFr(row.temperature_c, 1)}${NARROW_NBSP}°C`)
    if (row.vibration_hz !== null && row.vibration_hz !== undefined) parts.push(`${formatNumberFr(row.vibration_hz, 1)}${NARROW_NBSP}Hz`)
    const reading = parts.length ? parts.join(' · ') : 'nouveau relevé'
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
