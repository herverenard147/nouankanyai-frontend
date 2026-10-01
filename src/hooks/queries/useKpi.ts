import { useQuery } from '@tanstack/react-query'

import { fetchKpiSet } from '@/api/kpis'
import type { Profile } from '@/types/domain'

/** Même clé de cache (['kpi-set', profile]) pour les 4 indicateurs d'une bande KpiStrip : react-query
 * partage la même requête réseau entre les 4 KpiTile au lieu de refetcher 4 fois la même donnée. */
export function useKpiSet(profile: Profile) {
  return useQuery({ queryKey: ['kpi-set', profile], queryFn: () => fetchKpiSet(profile) })
}
