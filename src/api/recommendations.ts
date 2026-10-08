import { getCachedMachines, rawRecommend } from '@/api/rawBackend'
import { formatFcfa } from '@/lib/formatters'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import type { Advice, Profile } from '@/types/domain'

/**
 * Suggestions proactives (optimisation, efficacité) — jamais des alertes : pas de
 * problème actif à corriger, donc pas de bouton "Marquer comme résolu" (voir
 * src/api/alerts.ts / advice.ts, qui ne gardent que type === 'alerte'). Même source
 * backend (/api/recommend), filtrée sur les deux types restants.
 */
export async function fetchRecommendations(_profile: Profile): Promise<Advice[]> {
  const machines = await getCachedMachines()
  if (machines.length === 0) return []
  const { recommendations } = await rawRecommend(machines)

  return recommendations
    .filter((rec) => rec.type === 'optimisation' || rec.type === 'efficacite')
    .map((rec, i) => ({
      rank: String(i + 1).padStart(2, '0'),
      title: rec.title,
      detail: frenchNumbersWithUnits(`${rec.description} ${rec.action}`),
      impactLabel: rec.gain_fcfa > 0 ? `−${formatFcfa(rec.gain_fcfa)}` : rec.severity,
      impactKind: rec.gain_fcfa > 0 ? ('gain' as const) : ('severity' as const),
      provenance: 'synthetique' as const,
      machineId: rec.machine_id,
      // Même format que l'import automatique du plan d'action (voir api/actionPlan.ts) : une recommandation
      // « appliquée » depuis ici et reprise plus tard par le plan d'action pointent vers le même item.
      sourceRef: rec.gain_fcfa > 0 ? `${rec.machine_id}:${rec.type}:${rec.title}` : undefined,
      gainFcfa: rec.gain_fcfa,
    }))
}
