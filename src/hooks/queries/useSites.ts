import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawCreateSite, rawDeleteSite, rawSetSiteSubscription, rawSites } from '@/api/rawBackend'
import type { SubscriptionUnit } from '@/types/backend'

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

/** Puissance souscrite d'un site : le pic de puissance de Conso & coûts la compare aux pics mesurés. */
export function useSetSiteSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ siteId, ...payload }: { siteId: string; valeur: number | null; unite: SubscriptionUnit | null; cos_phi: number | null }) =>
      rawSetSiteSubscription(siteId, payload),
    onSuccess: () => {
      for (const key of ['sites', 'power-peak', 'audit']) void queryClient.invalidateQueries({ queryKey: [key] })
    },
  })
}
