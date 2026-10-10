import { useState } from 'react'
import { Link } from 'react-router-dom'

import { rawAdminBillPhoto } from '@/api/rawBackend'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'

import { MetricState } from '@/components/state/MetricState'
import { usePendingBills, useTierRequests, useUnpaidStatements, useValidateBill } from '@/hooks/queries/useBilling'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const TIER_LABEL: Record<string, string> = { decouverte: 'Découverte', essentiel: 'Essentiel', optimum: 'Optimum', decouverte_pro: 'Découverte Pro' }

/** Factures CIE en attente : seule une facture validée, justificatif à l'appui, entre dans un relevé. */
function PendingBills() {
  const pending = usePendingBills()
  const validate = useValidateBill()
  const [photo, setPhoto] = useState<{ id: string; url: string } | null>(null)
  async function showPhoto(id: string) {
    const { photo_data_url } = await rawAdminBillPhoto(id)
    setPhoto({ id, url: photo_data_url })
  }
  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Factures CIE à valider</h2>
      <p className="text-sm text-text-secondary">Comparez la saisie au justificatif avant de valider : une facture validée sert de base aux relevés et n’est plus modifiable.</p>
      <MetricState status={pending.status} isEmpty={pending.data?.length === 0}>
        <ul>
          {pending.data?.map((b) => (
            <li key={b.id} className="flex flex-col gap-2 border-t border-border py-2.5 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link to={`/app/admin/utilisateurs/${b.user_id}`} className="focus-ring font-semibold text-accent-cta">
                  {b.user_nom}
                </Link>
                <span className="text-text-secondary">
                  {b.month}
                  {b.period_months > 1 ? ` (${b.period_months} mois)` : ''}
                </span>
                <span className="tabular-nums text-text-primary">
                  {b.kwh_consumed !== null ? `${formatNumberFr(b.kwh_consumed)} kWh` : 'kWh manquants'} · {formatFcfa(b.amount_xof ?? 0)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {b.has_photo ? (
                  <button type="button" className="focus-ring font-semibold text-accent-cta hover:underline" onClick={() => void showPhoto(b.id)}>
                    Voir le justificatif
                  </button>
                ) : (
                  <span className="text-text-secondary">Justificatif manquant</span>
                )}
                <Button type="button" disabled={!b.has_photo || validate.isPending} onClick={() => validate.mutate({ billId: b.id, decision: 'validee' })}>
                  Valider
                </Button>
                <Button type="button" variant="outline" disabled={validate.isPending} onClick={() => validate.mutate({ billId: b.id, decision: 'rejetee' })}>
                  Rejeter
                </Button>
              </div>
              {photo?.id === b.id && <img src={photo.url} alt={`Justificatif de la facture ${b.month}`} className="max-h-96 w-fit rounded-card border border-border" />}
            </li>
          ))}
        </ul>
      </MetricState>
      <MutationError error={validate.error} />
    </section>
  )
}

/** Relevés à payer de tous les comptes et demandes de changement d'abonnement (ménages).
 * Le paiement se marque depuis la fiche du compte. */
export function AdminBillingPage() {
  const unpaid = useUnpaidStatements()
  const requests = useTierRequests()
  return (
    <div className="flex flex-col gap-7">
      <PendingBills />
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
