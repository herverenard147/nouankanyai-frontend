import { rawMachines, rawRecommend } from '@/api/rawBackend'
import { formatFcfaAmount } from '@/api/backendHelpers'
import type { Advice, Profile } from '@/types/domain'

export function adviceSectionTitle(_profile: Profile): string {
  return 'Conseils générés par le moteur de recommandation'
}

export async function fetchAdvice(_profile: Profile): Promise<Advice[]> {
  const machines = await rawMachines()
  if (machines.length === 0) return []
  const { recommendations } = await rawRecommend(machines)

  return recommendations.map((rec, i) => ({
    rank: String(i + 1).padStart(2, '0'),
    title: rec.title,
    detail: `${rec.description} ${rec.action}`,
    impactLabel: rec.gain_fcfa > 0 ? `−${formatFcfaAmount(rec.gain_fcfa)}` : rec.severity,
    provenance: 'synthetique' as const,
    machineId: rec.machine_id,
  }))
}
