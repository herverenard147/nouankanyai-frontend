import { useQuery } from '@tanstack/react-query'

import { fetchTariff } from '@/api/tariff'
import type { Profile } from '@/types/domain'

export function useTariff(profile: Profile) {
  return useQuery({ queryKey: ['tariff', profile], queryFn: () => fetchTariff(profile) })
}
