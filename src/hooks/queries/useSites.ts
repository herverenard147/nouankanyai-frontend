import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawCreateSite, rawDeleteSite, rawSites } from '@/api/rawBackend'

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

/** Les machines du site sont détachées côté serveur : leurs listes changent aussi. */
export function useDeleteSite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rawDeleteSite,
    onSuccess: () => {
      for (const key of ['sites', 'machines', 'machines-raw', 'equipment', 'machines-table', 'boitiers', 'audit']) void queryClient.invalidateQueries({ queryKey: [key] })
    },
  })
}
