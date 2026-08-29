import { useActionAlerts } from '@/hooks/queries/useAlerts'
import { useAdvice } from '@/hooks/queries/useAdvice'
import { useNotificationStore } from '@/store/notificationStore'
import type { Profile } from '@/types/domain'

/** Nombre d'alertes "action" actives non encore vues (voir notificationStore). */
export function useAlertsBadgeCount(profile: Profile): number {
  const query = useActionAlerts(profile)
  const seenIds = useNotificationStore((s) => s.seenAlertIds)
  if (query.status !== 'success') return 0
  return query.data.filter((alert) => !seenIds.includes(alert.id)).length
}

/** Nombre de conseils actifs non encore vus (voir notificationStore). */
export function useAdviceBadgeCount(profile: Profile): number {
  const query = useAdvice(profile)
  const seenIds = useNotificationStore((s) => s.seenAdviceIds)
  if (query.status !== 'success') return 0
  return query.data.filter((advice) => !seenIds.includes(`${advice.rank}-${advice.title}`)).length
}
