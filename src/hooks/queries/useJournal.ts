import { useQuery } from '@tanstack/react-query'

import { fetchJournal } from '@/api/journal'
import type { Profile } from '@/types/domain'

export function useJournal(profile: Profile) {
  return useQuery({ queryKey: ['journal', profile], queryFn: () => fetchJournal(profile) })
}
