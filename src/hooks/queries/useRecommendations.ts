import { useQuery } from '@tanstack/react-query'

import { fetchRecommendations } from '@/api/recommendations'
import type { Profile } from '@/types/domain'

export function useRecommendations(profile: Profile) {
  return useQuery({ queryKey: ['recommendations', profile], queryFn: () => fetchRecommendations(profile) })
}
