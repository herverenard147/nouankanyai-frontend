import type { Advice } from '@/types/domain'

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
