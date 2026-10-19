import { Link } from 'react-router-dom'

import { useBilling } from '@/hooks/queries/useBilling'

/**
 * Bandeau des services coupés pour impayé (décision du propriétaire, 2026-10-19) : 15 jours après l'échéance d'un relevé,
 * analyses, assistant, alertes, prévisions et boîtiers sont suspendus ; le compte, l'historique, les factures et les
 * relevés restent consultables. Le bandeau dit pourquoi et mène au relevé à régler.
 */
export function ServicesCutBanner() {
  const billing = useBilling()
  const services = billing.data?.services
  if (!services?.coupes) return null
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 border border-alert bg-card px-4 py-3 text-sm">
      <p className="text-text-primary">{services.detail}</p>
      <Link
        to={services.releve_id ? `/app/facturation#releve-${services.releve_id}` : '/app/facturation'}
        className="focus-ring shrink-0 font-semibold text-accent-cta hover:underline"
      >
        Voir le relevé à régler
      </Link>
    </div>
  )
}
