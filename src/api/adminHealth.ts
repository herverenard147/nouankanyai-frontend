import { fetchKpi, kpiIdsFor } from '@/api/kpis'
import type { Kpi } from '@/types/domain'

/** Les KPI de santé plateforme sont les KPI admin comme les autres, un bloc chacun. */
export function healthKpiIds(): string[] {
  return kpiIdsFor('admin')
}

export function fetchHealthKpi(kpiId: string): Promise<Kpi> {
  return fetchKpi('admin', kpiId)
}
