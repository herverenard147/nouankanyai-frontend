import { useQuery } from '@tanstack/react-query'

import { fetchHealthKpi } from '@/api/adminHealth'

export function useAdminHealthKpi(kpiId: string) {
  return useQuery({ queryKey: ['kpi', 'admin', kpiId], queryFn: () => fetchHealthKpi(kpiId) })
}
