import { useQuery } from '@tanstack/react-query'

import { fetchPrediction } from '@/api/prediction'
import type { Profile } from '@/types/domain'

export function usePrediction(profile: Profile) {
  return useQuery({ queryKey: ['prediction', profile], queryFn: () => fetchPrediction(profile) })
}
