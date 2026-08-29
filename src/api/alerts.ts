import { rawMachineHistory, rawMachines, rawRecommend } from '@/api/rawBackend'
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
  const machines = await rawMachines()
  if (machines.length === 0) return { machines, recommendations: [] as Awaited<ReturnType<typeof rawRecommend>>['recommendations'] }
  const { recommendations } = await rawRecommend(machines)
  return { machines, recommendations }
}

export async function fetchActionAlerts(_profile: Profile): Promise<ActionAlert[]> {
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
      detail: rec.description,
      basis: rec.action,
      provenance: 'synthetique' as const,
      ctaLabel: 'Voir les conseils',
      ctaTarget: '/app/conseils',
    }))
}

export async function fetchAutoAlerts(_profile: Profile): Promise<AutoAlert[]> {
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
  const machines = await rawMachines()
  const histories = await Promise.all(machines.map((m) => rawMachineHistory(m.machine_id).catch(() => null)))
  const entries: AlertHistoryEntry[] = []
  histories.forEach((history, idx) => {
    if (!history) return
    const machine = machines[idx] as BackendMachine
    history.alerts.forEach((alert, i) => {
      entries.push({
        id: `${machine.machine_id}-hist-${i}`,
        date: new Date(alert.created_at).toLocaleString('fr-FR'),
        title: `${alert.type_alerte} — ${machine.nom}`,
        resolution: alert.action_recommandee,
        registre: 'action',
      })
    })
  })
  return entries.sort((a, b) => b.date.localeCompare(a.date))
}
