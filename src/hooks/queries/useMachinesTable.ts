import { useQuery } from '@tanstack/react-query'

import { fetchMachinesTable } from '@/api/machinesTable'
import type { Profile } from '@/types/domain'

export function useMachinesTable(profile: Profile) {
  return useQuery({ queryKey: ['machines-table', profile], queryFn: () => fetchMachinesTable(profile) })
}
