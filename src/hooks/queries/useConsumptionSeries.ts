import { useQuery } from '@tanstack/react-query'

import { fetchConsumptionSeries } from '@/api/consumption'
import type { Profile } from '@/types/domain'

export function useConsumptionSeries(profile: Profile, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['consumption', profile],
    queryFn: () => fetchConsumptionSeries(profile),
    enabled: options?.enabled ?? true,
  })
}
