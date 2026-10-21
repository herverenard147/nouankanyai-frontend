import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawCreateSite, rawDeleteSite, rawRenameSite, rawSetBreaker, rawSetSiteMeter, rawSetSiteSubscription, rawSites } from '@/api/rawBackend'
import type { MeterType, SubscriptionUnit } from '@/types/backend'

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

const SITE_KEYS = ['sites', 'power-peak', 'audit']

/** Logement d'un ménage (ou site) : nom, type de compteur et calibre du disjoncteur, en une seule validation. */
export function useUpdateLogement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (p: { site: { id: string; nom: string; compteur_type?: MeterType }; nom: string; compteur_type: MeterType; amperes?: number | null }) => {
      if (p.nom.trim() !== p.site.nom) await rawRenameSite(p.site.id, p.nom.trim())
      if (p.compteur_type !== (p.site.compteur_type ?? 'postpaye')) await rawSetSiteMeter(p.site.id, p.compteur_type)
      if (p.amperes !== undefined) await rawSetBreaker(p.amperes, p.site.id)
    },
    onSuccess: () => {
      for (const key of SITE_KEYS) void queryClient.invalidateQueries({ queryKey: [key] })
    },
  })
}

export function useSetSiteMeter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ siteId, compteur_type }: { siteId: string; compteur_type: MeterType }) => rawSetSiteMeter(siteId, compteur_type),
    onSuccess: () => {
      for (const key of SITE_KEYS) void queryClient.invalidateQueries({ queryKey: [key] })
    },
  })
}
