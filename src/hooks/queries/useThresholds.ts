import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchThresholds, updateThresholds } from '@/api/settings'

export function useThresholds() {
  return useQuery({ queryKey: ['thresholds'], queryFn: fetchThresholds })
}

export function useUpdateThresholds() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateThresholds,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['thresholds'] }),
  })
}
