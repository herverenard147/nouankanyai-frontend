import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawCreateSite, rawSites } from '@/api/rawBackend'

export function useSites() {
  return useQuery({ queryKey: ['sites'], queryFn: rawSites })
}

export function useCreateSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawCreateSite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sites'] }),
  })
}
