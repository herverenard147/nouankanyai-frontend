import { formatFcfaAmount } from '@/api/backendHelpers'
import { rawImportPlanItems, rawPlanItems, rawPlanSummary, rawMachines, rawRecommend } from '@/api/rawBackend'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import type { BackendPlanItem, BackendPlanStatus } from '@/types/backend'
import type { ActionPlanItem, ActionPlanSummary, PlanStatus, Profile } from '@/types/domain'

export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  fait: 'Fait',
  abandonne: 'Abandonnée',
}

export function toPlanItem(item: BackendPlanItem): ActionPlanItem {
  const gain = item.gain_estime_fcfa ?? 0
  return {
    id: item.id,
    title: item.title,
    detail: frenchNumbersWithUnits(item.description ?? ''),
    gain,
    amountLabel: gain > 0 ? `−${formatFcfaAmount(gain)}` : '',
    status: item.status as BackendPlanStatus,
    statusLabel: PLAN_STATUS_LABEL[item.status],
    // Le gain vient du moteur de recommandation (jeu de données synthétique) : jamais une mesure.
    provenance: 'synthetique',
  }
}

/**
 * Plan d'action du mois (PME/Industrie). Lu depuis `/api/v1/plan/items`. Tant que le plan est vide, on y reprend
 * les recommandations chiffrées du moteur (`/api/recommend`) — idempotent côté backend (même `source_ref` = ignoré).
 */
export async function fetchActionPlan(profile: Profile): Promise<ActionPlanItem[]> {
  if (profile !== 'pme' && profile !== 'industrie') return []
  let items = await rawPlanItems()
  if (items.length === 0) {
    const machines = await rawMachines()
    if (machines.length > 0) {
      const { recommendations } = await rawRecommend(machines)
      const priced = recommendations.filter((r) => (r.type === 'optimisation' || r.type === 'efficacite') && r.gain_fcfa > 0)
      if (priced.length > 0) {
        await rawImportPlanItems(
          priced.map((r) => ({
            source_ref: `${r.machine_id}:${r.type}:${r.title}`,
            title: r.title,
            description: `${r.description} ${r.action}`,
            gain_estime_fcfa: r.gain_fcfa,
          })),
        )
        items = await rawPlanItems()
      }
    }
  }
  return items.map(toPlanItem)
}

export async function fetchPlanSummary(_profile: Profile): Promise<ActionPlanSummary> {
  const summary = await rawPlanSummary()
  return {
    potentialLabel: formatFcfaAmount(summary.potential_fcfa),
    doneLabel: formatFcfaAmount(summary.done_fcfa),
    openCount: summary.counts.a_faire + summary.counts.en_cours,
    doneCount: summary.counts.fait,
    totalCount: summary.total_items,
  }
}
