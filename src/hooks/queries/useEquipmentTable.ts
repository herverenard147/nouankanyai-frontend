import { useQuery } from '@tanstack/react-query'

import { fetchEquipmentTable } from '@/api/equipment'
import type { Profile } from '@/types/domain'

export function useEquipmentTable(profile: Profile) {
  return useQuery({ queryKey: ['equipment', profile], queryFn: () => fetchEquipmentTable(profile) })
}
