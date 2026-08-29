import { useQuery } from '@tanstack/react-query'

import { fetchOpenAnomalies, fetchResolutions } from '@/api/anomalies'
import type { Profile } from '@/types/domain'

export function useOpenAnomalies(profile: Profile) {
  return useQuery({ queryKey: ['anomalies-open', profile], queryFn: () => fetchOpenAnomalies(profile) })
}

export function useResolutions(profile: Profile) {
  return useQuery({ queryKey: ['anomalies-resolutions', profile], queryFn: () => fetchResolutions(profile) })
}
