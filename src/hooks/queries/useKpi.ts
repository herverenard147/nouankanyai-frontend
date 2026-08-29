import { useQuery } from '@tanstack/react-query'

import { fetchKpi } from '@/api/kpis'
import type { Profile } from '@/types/domain'

export function useKpi(profile: Profile, kpiId: string) {
  return useQuery({ queryKey: ['kpi', profile, kpiId], queryFn: () => fetchKpi(profile, kpiId) })
}
