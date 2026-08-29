import { useQuery } from '@tanstack/react-query'

import { fetchAdvice } from '@/api/advice'
import type { Profile } from '@/types/domain'

export function useAdvice(profile: Profile) {
  return useQuery({ queryKey: ['advice', profile], queryFn: () => fetchAdvice(profile) })
}
