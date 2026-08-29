import { useQuery } from '@tanstack/react-query'

import { fetchActionAlerts, fetchAlertHistory, fetchAutoAlerts } from '@/api/alerts'
import type { Profile } from '@/types/domain'

export function useActionAlerts(profile: Profile) {
  return useQuery({ queryKey: ['alerts-action', profile], queryFn: () => fetchActionAlerts(profile) })
}

export function useAutoAlerts(profile: Profile) {
  return useQuery({ queryKey: ['alerts-auto', profile], queryFn: () => fetchAutoAlerts(profile) })
}

export function useAlertHistory(profile: Profile) {
  return useQuery({ queryKey: ['alerts-history', profile], queryFn: () => fetchAlertHistory(profile) })
}
