import type { BackendNotification } from '@/types/backend'
import type { Advice, Profile } from '@/types/domain'

/** Ancre d'un conseil dans la page Conseils, partagée par la liste et par la cloche des notifications. */
export function adviceAnchor(advice: Pick<Advice, 'machineId' | 'title'>): string {
  const slug = `${advice.machineId ?? ''}-${advice.title}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `conseil-${slug}`
}

/** Libellé de la cloche, lu par les lecteurs d'écran et affiché au survol. */
export function notificationLabel(count: number): string {
  if (count <= 0) return 'Notifications : rien de nouveau'
  return count === 1 ? 'Notifications : 1 nouvelle' : `Notifications : ${count} nouvelles`
}

/** Lien d'une notification pour ce type de compte. L'industrie suit ses boîtiers dans « Sources de mesures » :
 * « /app/boitier/<id> » lui est interdit et renvoyait à l'accueil (test du 2026-10-20). */
export function notificationLink(profile: Profile, link: string): string {
  if (profile === 'industrie') return link.replace(/^\/app\/boitier(?=\/|$|#)/, '/app/sources')
  return link
}

/** Types de notifications considérés comme vus quand on ouvre la page qui les liste (comme les compteurs du menu). */
const SEEN_ON_PAGE: Record<string, BackendNotification['kind'][]> = {
  '/app/alertes': ['alerte', 'retour'],
  '/app/conseils': ['conseil'],
  '/app/factures': ['facture'],
  '/app/facturation': ['releve'],
  '/app/plan-action': ['plan'],
}

export function kindsSeenOnPage(pathname: string): BackendNotification['kind'][] {
  return SEEN_ON_PAGE[pathname.replace(/\/$/, '')] ?? []
}
