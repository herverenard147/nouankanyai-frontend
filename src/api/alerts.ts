import { getCachedMachines, rawAlertRegistry, rawPlatformAlerts, getCachedRecommend } from '@/api/rawBackend'
import { alertProvenance } from '@/lib/alertRegistry'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import type { BackendAlertEntry, BackendMachine } from '@/types/backend'
import type { ActionAlert, AutoAlert, Profile } from '@/types/domain'

/**
 * Le backend n'a pas de registre d'alerte dédié : les alertes sont dérivées de
 * `/api/recommend`. `auto_resolu` vaut toujours `false` depuis le Volet 2 (C3) :
 * aucun délestage n'est exécuté par cette route, un délestage n'est « exécuté »
 * qu'après une commande acquittée par le boîtier. La liste des actions
 * automatiques reste donc vide tant qu'aucune n'est réellement faite.
 */
async function fetchRecommendations() {
  const machines = await getCachedMachines()
  if (machines.length === 0) return { machines, recommendations: [] as Awaited<ReturnType<typeof getCachedRecommend>>['recommendations'] }
  const { recommendations } = await getCachedRecommend(machines)
  return { machines, recommendations }
}

export async function fetchActionAlerts(profile: Profile): Promise<ActionAlert[]> {
  // Admin : alertes de TOUTE la plateforme (tous comptes), pas du compte Admin lui-même
  // (qui n'a pas d'équipement en propre, voir GET /api/admin/alerts : corrige un scope
  // erroné trouvé par audit, 2026-10-01 : la page se disait "tous profils confondus" mais
  // était en réalité toujours vide).
  if (profile === 'admin') {
    const { recommendations } = await rawPlatformAlerts()
    return recommendations
      .filter((rec) => rec.type === 'alerte')
      .map((rec, i) => ({
        ...adminCard(rec, i),
        tier: 'alerte' as const,
        level: `sévérité ${rec.severity}`,
      }))
  }

  const { machines, cards } = await registryCards('alerte')
  return [...cards, ...pendingDiagnosisAlerts(machines, new Set(cards.map((alert) => alert.machineId)))]
}

/**
 * Une machine passée en alerte par « Vérifier et résoudre » n'a de diagnostic détaillé qu'après
 * quelques relevés. Entre-temps elle était comptée en anomalie dans la vue d'ensemble sans apparaître
 * dans la liste : elle y figure maintenant, avec ce que l'on sait, sans inventer de cause.
 */
export function pendingDiagnosisAlerts(machines: BackendMachine[], alreadyListed: Set<string>): ActionAlert[] {
  return machines
    .filter((machine) => machine.status === 'alerte' && !alreadyListed.has(machine.machine_id))
    .map((machine) => ({
      kind: 'action' as const,
      id: `${machine.machine_id}-statut-alerte`,
      tier: 'alerte' as const,
      machineId: machine.machine_id,
      level: 'sévérité modérée',
      severity: 'modérée' as const,
      title: `Anomalie signalée sur ${machine.nom}`,
      detail: 'Le dernier contrôle de cet appareil a relevé une valeur hors seuil. Le diagnostic détaillé demande encore quelques relevés.',
      basis: 'Relancez la vérification de cet appareil après un moment.',
      provenance: 'synthetique' as const,
      ctaLabel: 'Voir les conseils',
      ctaTarget: '/app/conseils',
    }))
}

/**
 * « À vérifier » : un écart à l'habitude SOUS le seuil (diagnostic « surveillance »), pas un danger établi. Liste à
 * part, jamais comptée parmi les alertes (niveaux de signalement : une alerte dit qu'un seuil est franchi maintenant).
 */
export async function fetchToCheckAlerts(profile: Profile): Promise<ActionAlert[]> {
  if (profile === 'admin') {
    const { recommendations } = await rawPlatformAlerts()
    return recommendations
      .filter((rec) => rec.type === 'a_verifier')
      .map((rec, i) => ({ ...adminCard(rec, i), tier: 'a_verifier' as const, level: 'à vérifier' }))
  }
  return (await registryCards('a_verifier')).cards
}

type PlatformRec = Awaited<ReturnType<typeof rawPlatformAlerts>>['recommendations'][number]

/**
 * Une seule source (plan validé le 2026-10-20) : les listes « Alertes » et « À vérifier » sont les alertes OUVERTES du
 * registre, comme l'historique. Avant, elles étaient recalculées par /api/recommend à chaque visite : une alerte
 * pouvait être « en cours » dans l'historique et absente de la liste. /api/recommend est toujours appelé d'abord, car
 * c'est lui qui met le registre à jour à la visite (en plus du balayage du serveur).
 */
async function registryCards(tier: 'alerte' | 'a_verifier'): Promise<{ machines: BackendMachine[]; cards: ActionAlert[] }> {
  const { machines, recommendations } = await fetchRecommendations()
  const open = machines.length ? await rawAlertRegistry('ouvertes', 200) : []
  const severityOf = (entry: BackendAlertEntry): ActionAlert['severity'] => {
    if (tier === 'a_verifier') return 'faible'
    if (entry.kind === 'danger_visuel') return 'critique'
    return recommendations.find((rec) => rec.machine_id === entry.machine_code && rec.type === 'alerte')?.severity ?? 'modérée'
  }
  const cards = open
    .filter((entry) => entry.level === tier)
    .map((entry) => {
      const severity = severityOf(entry)
      return {
        kind: 'action' as const,
        id: entry.id,
        tier,
        machineId: entry.machine_code ?? '',
        level: tier === 'a_verifier' ? 'à vérifier' : `sévérité ${severity}`,
        severity,
        title: `${entry.kind_label ?? entry.title ?? 'Alerte'} : ${entry.machine_nom ?? entry.machine_code ?? 'appareil'}`,
        detail: frenchNumbersWithUnits(entry.description ?? ''),
        basis: frenchNumbersWithUnits(entry.action ?? ''),
        provenance: alertProvenance(entry) ?? ('synthetique' as const),
        ctaLabel: 'Voir les conseils',
        ctaTarget: '/app/conseils',
        registry: entry,
      }
    })
  return { machines, cards }
}

function adminCard(rec: PlatformRec, i: number) {
  return {
    kind: 'action' as const,
    id: `${rec.machine_id}-${rec.type}-${i}`,
    machineId: rec.machine_id,
    severity: rec.severity,
    title: `${rec.title} (${rec.owner_nom})`,
    detail: frenchNumbersWithUnits(rec.description),
    basis: frenchNumbersWithUnits(rec.action),
    provenance: 'synthetique' as const,
    ctaLabel: 'Voir le compte',
    ctaTarget: `/app/admin/utilisateurs/${rec.owner_id}`,
  }
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
      timestamp: 'action exécutée, calculée à cet instant',
      provenance: 'synthetique' as const,
    }))
}
