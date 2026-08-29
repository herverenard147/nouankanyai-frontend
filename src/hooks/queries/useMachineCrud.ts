import { useMutation, useQueryClient } from '@tanstack/react-query'

import { rawAddMachine, rawDeleteMachine, rawResetMachine, rawUpdateMachine } from '@/api/rawBackend'
import type { BackendMachineUpdatePayload, BackendNewMachinePayload } from '@/types/backend'

/**
 * Équipements (PME) et machines (Industrie) sont la même ressource backend
 * (`/api/machines`, voir equipment.ts/machinesTable.ts) — on invalide les deux
 * query keys après toute mutation, peu importe la page d'où elle vient. Les
 * alertes (alerts-action/alerts-auto) et l'historique en dérivent aussi (voir
 * api/alerts.ts) : une résolution de machine doit les rafraîchir également,
 * sinon l'alerte résolue reste affichée jusqu'au prochain remount.
 */
function invalidateMachineQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['equipment'] })
  queryClient.invalidateQueries({ queryKey: ['machines-table'] })
  queryClient.invalidateQueries({ queryKey: ['machines-raw'] })
  queryClient.invalidateQueries({ queryKey: ['alerts-action'] })
  queryClient.invalidateQueries({ queryKey: ['alerts-auto'] })
  queryClient.invalidateQueries({ queryKey: ['alerts-history'] })
  queryClient.invalidateQueries({ queryKey: ['anomalies-open'] })
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

/** Marque une machine comme résolue (remet ses relevés à un état normal côté
 * backend) — c'est ce qui fait disparaître l'alerte associée. */
export function useResolveMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (machineId: string) => rawResetMachine(machineId),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}
