import { useQuery } from '@tanstack/react-query'

import { fetchPredictionsBundle } from '@/api/prediction'
import type { PredictionGranularity, Profile } from '@/types/domain'

export function usePredictionsBundle(
  profile: Profile,
  granularity: PredictionGranularity,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['predictions-bundle', profile, granularity],
    queryFn: () => fetchPredictionsBundle(profile, granularity),
    enabled: options?.enabled ?? true,
  })
}
