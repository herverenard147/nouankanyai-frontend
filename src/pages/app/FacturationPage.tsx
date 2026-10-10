import { Link } from 'react-router-dom'

import { StatementList } from '@/components/billing/StatementList'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { useBilling, useRequestTier } from '@/hooks/queries/useBilling'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendBilling } from '@/types/backend'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'

/** Ce que le compte paie à Nouankany (GET /api/v1/billing) : « Abonnement » pour le Ménage,
 * « Facturation Nouankany » pour PME et Industrie. */
export function FacturationPage() {
  const query = useBilling()
  return (
    <div className="flex flex-col gap-7">
      <MetricState status={query.status}>
        {query.data && (query.data.segment === 'menage' ? <MenageSubscription billing={query.data} /> : <BusinessContract billing={query.data} />)}
      </MetricState>
      {query.data && <EstimatedSavings billing={query.data} />}
    </div>
  )
}

function BusinessContract({ billing }: { billing: BackendBilling }) {
  const isTrial = useSessionStore((s) => s.session?.isTrial)
  const c = billing.contract
  if (!c || c.kind !== 'pme_industrie') {
    const d = billing.defaults
    return (
      <section className={SECTION}>
        <h1 className="text-section-title font-semibold text-text-primary">Facturation Nouankany</h1>
        <p className="text-sm text-text-secondary">
          Aucun contrat pour l’instant. Tout commence par un audit de référence ({formatFcfa(d.audit_fee_fcfa)}, une fois) qui mesure votre
          consommation actuelle. Ensuite : une redevance de {formatFcfa(d.saas_fee_fcfa)} par mois et {formatNumberFr(d.savings_share_pct)} % des
          économies réellement mesurées sur vos factures CIE. Un mois sans économie, vous ne payez que la redevance.
        </p>
        {billing.effective_tier === 'decouverte_pro' && billing.pme_free_tier && (
          <p className="text-sm text-text-secondary">
            En attendant, votre compte est sur le palier gratuit {billing.pme_free_tier.nom} : {billing.pme_free_tier.fonctionnalites.join(', ')}.
          </p>
        )}
        {isTrial && (
          <p className="text-sm text-text-secondary">
            Compte d’essai : aucun montant ne vous est facturé. Les économies estimées ci-dessous viennent de vos données de démonstration.
          </p>
        )}
        <Link to="/demander-un-audit" className="focus-ring w-fit rounded-control bg-accent-cta px-5 py-3 text-sm font-semibold text-white hover:bg-accent-cta-hover">
          Demander un audit
        </Link>
      </section>
    )
  }
  return (
    <>
      <section className={SECTION}>
        <h1 className="text-section-title font-semibold text-text-primary">Votre contrat</h1>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          {[
            ['Ligne de base', `${formatNumberFr(c.baseline_kwh ?? 0)} kWh / mois`],
            ['Redevance', `${formatFcfa(c.saas_fee_fcfa ?? 0)} / mois`],
            ['Part des économies', `${formatNumberFr(c.savings_share_pct ?? 0)} %`],
            ['Audit de référence', formatFcfa(c.audit_fee_fcfa ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <dt className="text-xs text-text-secondary">{label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-text-secondary">
          {c.baseline_period ? `Ligne de base relevée pendant : ${c.baseline_period}. ` : ''}
          Premier mois facturé : {c.start_month}. Pas d’ajustement saisonnier de la ligne de base dans cette version du contrat.
        </p>
      </section>
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Relevés mensuels</h2>
        <MetricState status="success" isEmpty={billing.statements.length === 0}>
          <StatementList statements={billing.statements} />
        </MetricState>
      </section>
    </>
  )
}

function MenageSubscription({ billing }: { billing: BackendBilling }) {
  const request = useRequestTier()
  const current = billing.effective_tier ?? 'decouverte'
  const requested = billing.contract?.requested_tier
  return (
    <>
      <section className={SECTION}>
        <h1 className="text-section-title font-semibold text-text-primary">Abonnement</h1>
        {requested && (
          <p className="text-sm text-text-secondary" role="status">
            Changement vers {billing.tiers.find((t) => t.id === requested)?.nom} demandé : il sera actif après validation par l’équipe Nouankany.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {billing.tiers.map((tier) => (
            <div key={tier.id} className={`flex flex-col gap-2 border p-4 ${tier.id === current ? 'border-text-primary' : 'border-border'}`}>
              <h2 className="font-semibold text-text-primary">{tier.nom}</h2>
              <p className="tabular-nums text-text-primary">{tier.prix_mensuel_fcfa === 0 ? 'Gratuit' : `${formatFcfa(tier.prix_mensuel_fcfa)} / mois`}</p>
              <ul className="flex flex-col gap-1 text-sm text-text-secondary">
                {tier.fonctionnalites.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {tier.id === current ? (
                <span className="mt-auto text-xs font-semibold text-text-secondary">Votre abonnement</span>
              ) : (
                <Button type="button" variant="outline" className="mt-auto" disabled={request.isPending || requested === tier.id} onClick={() => request.mutate(tier.id)}>
                  {requested === tier.id ? 'Demande envoyée' : `Passer à ${tier.nom}`}
                </Button>
              )}
            </div>
          ))}
        </div>
        <MutationError error={request.error} />
      </section>
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Relevés</h2>
        <MetricState status="success" isEmpty={billing.statements.length === 0}>
          <StatementList statements={billing.statements} />
        </MetricState>
      </section>
    </>
  )
}

function EstimatedSavings({ billing }: { billing: BackendBilling }) {
  const s = billing.estimated_ai_savings
  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Économies estimées par les actions automatiques</h2>
      <p className="text-sm text-text-secondary">
        À titre indicatif, ce mois : {formatFcfa(s.month_total_fcfa)}. Ce chiffre ne sert jamais de base à la facturation, qui repose sur vos factures CIE.
      </p>
      <ProvenanceBadge value="estime" className="w-fit" />
    </section>
  )
}
