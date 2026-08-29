import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawAddMachine, rawEquipmentCatalog, rawMachines, rawResetMachine, rawSimulateMachine } from '@/api/rawBackend'

export function useMachines() {
  return useQuery({ queryKey: ['machines'], queryFn: rawMachines })
}

export function useEquipmentCatalog() {
  return useQuery({ queryKey: ['equipment-catalog'], queryFn: rawEquipmentCatalog, staleTime: Infinity })
}

export function useAddMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawAddMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  })
}

export function useSimulateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawSimulateMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  })
}

export function useResetMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawResetMachine,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['machines'] }),
  })
}
