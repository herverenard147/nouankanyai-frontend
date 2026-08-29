import { useMutation, useQueryClient } from '@tanstack/react-query'

import { rawAddMachine, rawDeleteMachine, rawUpdateMachine } from '@/api/rawBackend'
import type { BackendMachineUpdatePayload, BackendNewMachinePayload } from '@/types/backend'

/**
 * Équipements (PME) et machines (Industrie) sont la même ressource backend
 * (`/api/machines`, voir equipment.ts/machinesTable.ts) — on invalide les deux
 * query keys après toute mutation, peu importe la page d'où elle vient.
 */
function invalidateMachineQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['equipment'] })
  queryClient.invalidateQueries({ queryKey: ['machines-table'] })
  queryClient.invalidateQueries({ queryKey: ['machines-raw'] })
}

export function useAddMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BackendNewMachinePayload) => rawAddMachine(payload),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

export function useUpdateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ machineId, payload }: { machineId: string; payload: BackendMachineUpdatePayload }) =>
      rawUpdateMachine(machineId, payload),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

export function useDeleteMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (machineId: string) => rawDeleteMachine(machineId),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}
