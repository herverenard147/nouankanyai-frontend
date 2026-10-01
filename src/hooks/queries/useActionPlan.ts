import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchActionPlan, fetchPlanSummary } from '@/api/actionPlan'
import { rawCreatePlanItem, rawDeletePlanItem, rawImportPlanItems, rawUpdatePlanItem } from '@/api/rawBackend'
import type { BackendPlanItemPayload, BackendPlanItemUpdate } from '@/types/backend'
import type { Profile } from '@/types/domain'

/** Le plan d'action n'existe que pour PME et Industrie. */
export const hasPlan = (profile: Profile) => profile === 'pme' || profile === 'industrie'

export function useActionPlan(profile: Profile) {
  return useQuery({ queryKey: ['action-plan', profile], queryFn: () => fetchActionPlan(profile), enabled: hasPlan(profile) })
}

export function usePlanSummary(profile: Profile) {
  return useQuery({ queryKey: ['action-plan-summary', profile], queryFn: () => fetchPlanSummary(profile), enabled: hasPlan(profile) })
}

/** Création, modification et retrait d'une action : rafraîchit le plan, ses totaux et l'audit. */
export function usePlanMutations(profile: Profile) {
  const client = useQueryClient()
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['action-plan'] })
    void client.invalidateQueries({ queryKey: ['action-plan-summary'] })
    void client.invalidateQueries({ queryKey: ['audit'] })
  }
  void profile
  return {
    create: useMutation({ mutationFn: (payload: BackendPlanItemPayload) => rawCreatePlanItem(payload), onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: BackendPlanItemUpdate }) => rawUpdatePlanItem(id, payload),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => rawDeletePlanItem(id), onSuccess: refresh }),
  }
}

/**
 * Marque une recommandation (page Conseils/Recommandations) comme appliquée : la reprend dans le plan
 * d'action (import idempotent par `source_ref`, même mécanisme que l'import automatique de
 * `fetchActionPlan`) puis la passe directement au statut « fait ». N'existe que pour PME/Industrie
 * (voir `hasPlan`) : le Ménage n'a pas de plan d'action côté backend.
 */
export function useApplyRecommendation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (reco: { sourceRef: string; title: string; description: string; gainFcfa: number }) => {
      const [item] = await rawImportPlanItems([
        { source_ref: reco.sourceRef, title: reco.title, description: reco.description, gain_estime_fcfa: reco.gainFcfa },
      ])
      return rawUpdatePlanItem(item.id, { status: 'fait' })
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['action-plan'] })
      void client.invalidateQueries({ queryKey: ['action-plan-summary'] })
      void client.invalidateQueries({ queryKey: ['audit'] })
    },
  })
}
