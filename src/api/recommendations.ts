import { rawMachines, rawRecommend } from '@/api/rawBackend'
import { formatFcfaAmount } from '@/api/backendHelpers'
import type { Advice, Profile } from '@/types/domain'

/**
 * Suggestions proactives (optimisation, efficacité) — jamais des alertes : pas de
 * problème actif à corriger, donc pas de bouton "Marquer comme résolu" (voir
 * src/api/alerts.ts / advice.ts, qui ne gardent que type === 'alerte'). Même source
 * backend (/api/recommend), filtrée sur les deux types restants.
 */
export async function fetchRecommendations(_profile: Profile): Promise<Advice[]> {
  const machines = await rawMachines()
  if (machines.length === 0) return []
  const { recommendations } = await rawRecommend(machines)

  return recommendations
    .filter((rec) => rec.type === 'optimisation' || rec.type === 'efficacite')
    .map((rec, i) => ({
      rank: String(i + 1).padStart(2, '0'),
      title: rec.title,
      detail: `${rec.description} ${rec.action}`,
      impactLabel: rec.gain_fcfa > 0 ? `−${formatFcfaAmount(rec.gain_fcfa)}` : rec.severity,
      provenance: 'synthetique' as const,
      machineId: rec.machine_id,
    }))
}
