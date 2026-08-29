import { useQuery } from '@tanstack/react-query'

import { rawMachineHistory } from '@/api/rawBackend'

export function useMachineHistory(machineId: string | null) {
  return useQuery({
    queryKey: ['machine-history', machineId],
    queryFn: () => rawMachineHistory(machineId as string),
    enabled: Boolean(machineId),
  })
}
