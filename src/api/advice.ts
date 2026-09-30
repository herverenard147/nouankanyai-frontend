import { rawMachines, rawRecommend } from '@/api/rawBackend'
import { formatFcfaAmount } from '@/api/backendHelpers'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import type { Advice, Profile } from '@/types/domain'

export function adviceSectionTitle(_profile: Profile): string {
  return 'Conseils générés par le moteur de recommandation'
}

export async function fetchAdvice(_profile: Profile): Promise<Advice[]> {
  const machines = await rawMachines()
  if (machines.length === 0) return []
  const { recommendations } = await rawRecommend(machines)

  // Conseils = exactement les mêmes éléments qu'Alertes (voir src/api/alerts.ts),
  // ni plus ni moins : un conseil de dépannage n'a de sens que pour un problème
  // réellement détecté. Optimisation/efficacité vivent dans
  // src/api/recommendations.ts, le délestage auto-exécuté reste dans le Journal.
  return recommendations
    .filter((rec) => rec.type === 'alerte')
    .map((rec, i) => ({
      rank: String(i + 1).padStart(2, '0'),
      title: rec.title,
      detail: frenchNumbersWithUnits(`${rec.description} ${rec.action}`),
      impactLabel: rec.gain_fcfa > 0 ? `−${formatFcfaAmount(rec.gain_fcfa)}` : rec.severity,
      impactKind: rec.gain_fcfa > 0 ? ('gain' as const) : ('severity' as const),
      provenance: 'synthetique' as const,
      machineId: rec.machine_id,
      troubleshooting: rec.troubleshooting,
    }))
}
