import { rawMachineHistory, getCachedMachines, rawPlatformAlerts, rawRecommend } from '@/api/rawBackend'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import type { BackendMachine } from '@/types/backend'
import type { ActionAlert, AlertHistoryEntry, AutoAlert, Profile } from '@/types/domain'

/**
 * Le backend n'a pas de registre d'alerte dédié : les deux registres du
 * design (action humaine requise / action automatique déjà exécutée) sont
 * dérivés de `/api/recommend`, qui classe déjà ses recommandations en
 * `auto_resolu` (délestage exécuté par l'IA) vs le reste (nécessite une
 * action humaine) — un mapping direct, pas une invention.
 */
async function fetchRecommendations() {
  const machines = await getCachedMachines()
  if (machines.length === 0) return { machines, recommendations: [] as Awaited<ReturnType<typeof rawRecommend>>['recommendations'] }
  const { recommendations } = await rawRecommend(machines)
  return { machines, recommendations }
}

export async function fetchActionAlerts(profile: Profile): Promise<ActionAlert[]> {
  // Admin : alertes de TOUTE la plateforme (tous comptes), pas du compte Admin lui-même
  // (qui n'a pas d'équipement en propre, voir GET /api/admin/alerts — corrige un scope
  // erroné trouvé par audit, 2026-10-01 : la page se disait "tous profils confondus" mais
  // était en réalité toujours vide).
  if (profile === 'admin') {
    const { recommendations } = await rawPlatformAlerts()
    return recommendations
      .filter((rec) => rec.type === 'alerte')
      .map((rec, i) => ({
        kind: 'action' as const,
        id: `${rec.machine_id}-${rec.type}-${i}`,
        machineId: rec.machine_id,
        level: `sévérité ${rec.severity}`,
        title: `${rec.title} (${rec.owner_nom})`,
        detail: frenchNumbersWithUnits(rec.description),
        basis: frenchNumbersWithUnits(rec.action),
        provenance: 'synthetique' as const,
        ctaLabel: 'Voir le compte',
        ctaTarget: `/app/admin/utilisateurs/${rec.owner_id}`,
      }))
  }

  const { recommendations } = await fetchRecommendations()
  // Alertes = uniquement de vrais problèmes détectés (anomalie/surchauffe/
  // vibration), jamais optimisation/efficacité (des suggestions, pas des
  // défauts — "Marquer comme résolu" n'a aucun sens pour elles, voir
  // src/api/recommendations.ts) ni délestage (déjà dans le Journal).
  return recommendations
    .filter((rec) => rec.type === 'alerte')
    .map((rec, i) => ({
      kind: 'action' as const,
      id: `${rec.machine_id}-${rec.type}-${i}`,
      machineId: rec.machine_id,
      level: `sévérité ${rec.severity}`,
      title: rec.title,
      detail: frenchNumbersWithUnits(rec.description),
      basis: frenchNumbersWithUnits(rec.action),
      provenance: 'synthetique' as const,
      ctaLabel: 'Voir les conseils',
      ctaTarget: '/app/conseils',
    }))
}

export async function fetchAutoAlerts(profile: Profile): Promise<AutoAlert[]> {
  if (profile === 'admin') return []
  const { recommendations } = await fetchRecommendations()
  return recommendations
    .filter((rec) => rec.auto_resolu)
    .map((rec, i) => ({
      kind: 'auto' as const,
      id: `${rec.machine_id}-${rec.type}-${i}`,
      title: rec.title,
      detail: `${rec.description} ${rec.action}`,
      timestamp: 'délestage auto-exécuté, calculé à cet instant',
      provenance: 'synthetique' as const,
    }))
}

/**
 * Historique : les vraies détections (AIAlert) enregistrées par machine, via
 * `/api/machines/{id}/history`. `is_resolved` ne bascule jamais à true côté
 * backend actuellement (aucune route ne le fait) : tout est donc classé
 * "action" — pas de fausse case "auto" pour ces entrées-là.
 */
export async function fetchAlertHistory(_profile: Profile): Promise<AlertHistoryEntry[]> {
  const machines = await getCachedMachines()
  const histories = await Promise.all(machines.map((m) => rawMachineHistory(m.machine_id).catch(() => null)))
  const entries: AlertHistoryEntry[] = []
  histories.forEach((history, idx) => {
    if (!history) return
    const machine = machines[idx] as BackendMachine
    history.alerts.forEach((alert, i) => {
      entries.push({
        id: `${machine.machine_id}-hist-${i}`,
        date: new Date(alert.created_at).toLocaleString('fr-FR'),
        title: `${alert.type_alerte}, ${machine.nom}`,
        resolution: alert.action_recommandee,
        registre: 'action',
      })
    })
  })
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
