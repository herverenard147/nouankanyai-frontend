import { Link } from 'react-router-dom'

import { MetricState } from '@/components/state/MetricState'
import { useTierRequests, useUnpaidStatements } from '@/hooks/queries/useBilling'
import { formatFcfa } from '@/lib/formatters'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const TIER_LABEL: Record<string, string> = { decouverte: 'Découverte', essentiel: 'Essentiel', optimum: 'Optimum' }

/** Relevés à payer de tous les comptes et demandes de changement d'abonnement (ménages).
 * Le paiement se marque depuis la fiche du compte. */
export function AdminBillingPage() {
  const unpaid = useUnpaidStatements()
  const requests = useTierRequests()
  return (
    <div className="flex flex-col gap-7">
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Relevés à payer</h2>
        <MetricState status={unpaid.status} isEmpty={unpaid.data?.length === 0}>
          <ul>
            {unpaid.data?.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-2.5 text-sm">
                <Link to={`/app/admin/utilisateurs/${s.user_id}`} className="focus-ring font-semibold text-accent-cta">
                  {s.user_nom}
                </Link>
                <span className="text-text-secondary">{s.month}</span>
                <span className="tabular-nums text-text-primary">{formatFcfa(s.total_fcfa ?? 0)}</span>
              </li>
            ))}
          </ul>
        </MetricState>
      </section>
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Demandes de changement d&rsquo;abonnement</h2>
        <MetricState status={requests.status} isEmpty={requests.data?.length === 0}>
          <ul>
            {requests.data?.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-2.5 text-sm">
                <Link to={`/app/admin/utilisateurs/${r.user_id}`} className="focus-ring font-semibold text-accent-cta">
                  {r.user_nom}
                </Link>
                <span className="text-text-secondary">
                  {TIER_LABEL[r.tier ?? 'decouverte']} vers {TIER_LABEL[r.requested_tier ?? ''] ?? r.requested_tier}
                </span>
              </li>
            ))}
          </ul>
        </MetricState>
      </section>
    </div>
  )
}
