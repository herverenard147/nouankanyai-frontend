import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { adminPanelIds, fetchAdminPanel, reloadModels } from '@/api/adminModels'

export function useAdminModelPanel(panelId: string) {
  return useQuery({ queryKey: ['admin-panel', panelId], queryFn: () => fetchAdminPanel(panelId) })
}

export function useReloadModels() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: reloadModels,
    onSuccess: () => {
      // ['ml-models']/['admin-metrics'] sont les caches partagés sous-jacents (voir
      // getCachedMlModels/getCachedAdminMetrics) : à invalider aussi, sinon les panneaux
      // rejouent une donnée pré-rechargement malgré l'invalidation de ['admin-panel', id].
      void queryClient.invalidateQueries({ queryKey: ['ml-models'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-metrics'] })
      for (const id of adminPanelIds()) queryClient.invalidateQueries({ queryKey: ['admin-panel', id] })
    },
  })
}
