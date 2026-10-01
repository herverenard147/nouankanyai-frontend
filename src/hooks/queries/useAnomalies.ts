import { useQuery } from '@tanstack/react-query'

import { fetchResolutions } from '@/api/anomalies'
import type { Profile } from '@/types/domain'

export function useResolutions(profile: Profile) {
  return useQuery({ queryKey: ['anomalies-resolutions', profile], queryFn: () => fetchResolutions(profile), enabled: profile === 'pme' || profile === 'industrie' })
}
