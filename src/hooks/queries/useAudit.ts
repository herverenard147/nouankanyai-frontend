import { useQuery } from '@tanstack/react-query'

import { fetchAudit } from '@/api/audit'
import type { Profile } from '@/types/domain'

export function useAudit(profile: Profile, category?: string, limit = 50) {
  return useQuery({ queryKey: ['audit', profile, category ?? 'all', limit], queryFn: () => fetchAudit(profile, { category, limit }) })
}
