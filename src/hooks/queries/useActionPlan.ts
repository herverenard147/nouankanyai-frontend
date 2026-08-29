import { useQuery } from '@tanstack/react-query'

import { fetchActionPlan } from '@/api/actionPlan'
import type { Profile } from '@/types/domain'

export function useActionPlan(profile: Profile) {
  return useQuery({ queryKey: ['action-plan', profile], queryFn: () => fetchActionPlan(profile) })
}
