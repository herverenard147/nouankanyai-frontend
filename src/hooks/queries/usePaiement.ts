import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { rawPayStatement, rawPaymentState, type PaymentMethod } from '@/api/rawBackend'

/** Démarre le paiement d'un relevé chez Jèko puis envoie le client sur la page de paiement. Le montant vient du serveur. */
export function usePayStatement() {
  return useMutation({
    mutationFn: ({ statementId, method }: { statementId: string; method: PaymentMethod }) => rawPayStatement(statementId, method),
    onSuccess: (started) => window.location.assign(started.redirect_url),
  })
}

/** État d'une tentative, relu toutes les 4 secondes tant qu'elle est en attente de confirmation (le serveur interroge Jèko). */
export function usePaymentState(reference: string | null) {
  const client = useQueryClient()
  return useQuery({
    queryKey: ['payment-state', reference],
    queryFn: async () => {
      const state = await rawPaymentState(reference as string)
      if (state.status === 'paid') void client.invalidateQueries({ queryKey: ['billing'] })
      return state
    },
    enabled: Boolean(reference),
    refetchInterval: (query) => (query.state.data?.status === 'pending' || !query.state.data ? 4000 : false),
  })
}
