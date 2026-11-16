import { Spinner } from '@/components/ui/Button'
import { usePaymentState } from '@/hooks/queries/usePaiement'

/** Retour de la page de paiement (`?paiement=retour&ref=…`). Le retour du client ne prouve rien : l'état vient du serveur,
 * qui le tient de Jèko (webhook signé ou consultation authentifiée). */
export function PaymentReturnBanner({ outcome, reference }: { outcome: string; reference: string | null }) {
  const state = usePaymentState(reference)
  const status = state.data?.status
  if (outcome === 'echec' || status === 'failed') {
    return <p role="alert" className="rounded-control border border-alert p-3 text-sm text-alert">Le paiement n’a pas abouti. Aucun montant n’a été validé : vous pouvez réessayer.</p>
  }
  if (status === 'paid') {
    return <p role="status" className="rounded-control border border-border p-3 text-sm font-semibold text-text-primary">Paiement confirmé. Merci : votre relevé est réglé.</p>
  }
  return (
    <p role="status" className="flex items-center gap-2 rounded-control border border-border p-3 text-sm text-text-secondary">
      <Spinner />
      Paiement en cours de confirmation. Cette page se met à jour toute seule, vous pouvez la laisser ouverte.
    </p>
  )
}
