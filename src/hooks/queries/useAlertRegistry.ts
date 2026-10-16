import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawAlertFeedback, rawAlertRegistry } from '@/api/rawBackend'
import type { BackendAlertFeedbackIn, BackendAlertStatus } from '@/types/backend'

/** Registre des alertes du compte (jamais supprimées). */
export function useAlertRegistry(status: BackendAlertStatus = 'toutes', enabled = true) {
  return useQuery({ queryKey: ['alert-registry', status], queryFn: () => rawAlertRegistry(status), enabled })
}

/** Retour de l'utilisateur sur une alerte fermée : met à jour tout le registre. */
export function useAlertFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, body }: { alertId: string; body: BackendAlertFeedbackIn }) => rawAlertFeedback(alertId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-registry'] })
    },
  })
}
