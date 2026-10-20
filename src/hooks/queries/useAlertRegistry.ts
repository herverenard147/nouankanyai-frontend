import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawAlertFeedback, rawAlertRegistry, rawAlertTakeCharge } from '@/api/rawBackend'
import type { BackendAlertFeedbackIn, BackendAlertStatus } from '@/types/backend'

/** Registre des alertes du compte (jamais supprimées). */
export function useAlertRegistry(status: BackendAlertStatus = 'toutes', enabled = true) {
  return useQuery({ queryKey: ['alert-registry', status], queryFn: () => rawAlertRegistry(status), enabled })
}

/** Les listes « Alertes » et « À vérifier » lisent le registre : tout se met à jour ensemble. */
function invalidateAlerts(queryClient: ReturnType<typeof useQueryClient>) {
  for (const key of ['alert-registry', 'alerts-action', 'alerts-to-check', 'notifications', 'audit']) void queryClient.invalidateQueries({ queryKey: [key] })
}

/** Retour de l'utilisateur sur une alerte fermée, ou « fausse alerte » sur une alerte en cours (qui la ferme). */
export function useAlertFeedback() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ alertId, body }: { alertId: string; body: BackendAlertFeedbackIn }) => rawAlertFeedback(alertId, body),
    onSuccess: () => invalidateAlerts(queryClient),
  })
}

/** « Je m'en occupe » : l'alerte reste ouverte, la page dit qui s'en charge. */
export function useAlertTakeCharge() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: rawAlertTakeCharge, onSuccess: () => invalidateAlerts(queryClient) })
}
