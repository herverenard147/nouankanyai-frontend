import { useQuery } from '@tanstack/react-query'

import { fetchPredictionsBundle } from '@/api/prediction'
import { useAccess } from '@/hooks/queries/useBilling'
import type { PredictionGranularity, Profile } from '@/types/domain'

export function usePredictionsBundle(
  profile: Profile,
  granularity: PredictionGranularity,
  options?: { enabled?: boolean },
) {
  // Prédictions selon la formule (2026-10-21) : aucune en Découverte, seulement les appareils prévus sinon.
  const access = useAccess()
  return useQuery({
    queryKey: ['predictions-bundle', profile, granularity, access.predicted],
    queryFn: () => fetchPredictionsBundle(profile, granularity, access.predicted),
    enabled: (options?.enabled ?? true) && access.predictions,
  })
}
