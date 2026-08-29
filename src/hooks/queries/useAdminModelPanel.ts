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
      for (const id of adminPanelIds()) queryClient.invalidateQueries({ queryKey: ['admin-panel', id] })
    },
  })
}
