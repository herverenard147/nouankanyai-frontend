import { useState } from 'react'
import { Link } from 'react-router-dom'

import { StatementList } from '@/components/billing/StatementList'
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Modal, MutationError } from '@/components/ui/Modal'
import { useBilling, useChangeTier } from '@/hooks/queries/useBilling'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendBilling, BackendBillingTier } from '@/types/backend'

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
          {/* Décisions du propriétaire : prix de l'audit fixé avec chaque client, abonnement de 50 000 FCFA dû chaque mois (2026-10-18
              et 21), 40 % des économies par défaut, de 30 à 50 % selon le contrat (retour au business plan le 2026-10-21). */}
          Aucun contrat pour l’instant. Tout commence par un audit de référence qui mesure votre consommation actuelle ; son prix est
          fixé avec vous, selon votre site. Ensuite : un abonnement de {formatFcfa(d.saas_fee_fcfa)} par mois et, par défaut,{' '}
          {formatNumberFr(d.savings_share_pct)} % des économies réellement mesurées sur vos factures CIE. Ce pourcentage peut être revu
          lors de l’audit, selon les capteurs et équipements à installer. L’abonnement est dû chaque mois, même sans économie ; la part des
          économies est calculée dès que la facture CIE du mois est validée.
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
            ['Abonnement', `${formatFcfa(c.saas_fee_fcfa ?? 0)} / mois`],
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
        {billing.abonnement && <SubscriptionStatus abonnement={billing.abonnement} />}
      </section>
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Part des économies</h2>
        <MetricState status="success" isEmpty={billing.statements.length === 0}>
          <StatementList statements={billing.statements} />
        </MetricState>
      </section>
    </>
  )
}

function MenageSubscription({ billing }: { billing: BackendBilling }) {
  const change = useChangeTier()
  const [target, setTarget] = useState<BackendBillingTier | null>(null)
  // La formule du contrat, pas l'accès du moment : pendant un essai ou sur un compte de
  // démonstration tout est ouvert, mais c'est cette formule qui reste ensuite.
  const contractTier = billing.access?.tier ?? billing.contract?.tier ?? 'decouverte'
  const reason = billing.access?.reason ?? null
  const nameOf = (id: string | null | undefined) => billing.tiers.find((t) => t.id === id)?.nom ?? ''
  const price = (t: BackendBillingTier) => (t.prix_mensuel_fcfa === 0 ? 'gratuit' : `${formatFcfa(t.prix_mensuel_fcfa)} par mois`)
  const trialEnd = billing.access?.trial_ends_at ? new Date(billing.access.trial_ends_at).toLocaleDateString('fr-FR') : null
  return (
    <>
      <section className={SECTION}>
        <h1 className="text-section-title font-semibold text-text-primary">Abonnement</h1>
        {reason === 'essai' && (
          <p className="text-sm text-text-primary" role="status">
            Essai gratuit{trialEnd ? ` jusqu’au ${trialEnd}` : ''} : toutes les fonctions sont ouvertes. Ensuite, votre formule sera{' '}
            <strong>{nameOf(contractTier)}</strong>, sauf si vous en choisissez une autre.
          </p>
        )}
        {reason === 'demonstration' && (
          <p className="text-sm text-text-primary" role="status">
            Compte de démonstration : toutes les fonctions sont ouvertes, quelle que soit la formule.
          </p>
        )}
        <p className="text-sm text-text-secondary">
          Changez de formule quand vous voulez. Une formule payante se règle d’avance pour 30 jours, à partir du jour du paiement ; le
          paiement en ligne n’est pas encore ouvert : réglez auprès de l’équipe Nouankany, qui l’enregistre.
        </p>
        {billing.abonnement && contractTier !== 'decouverte' && <SubscriptionStatus abonnement={billing.abonnement} menage />}
        {change.isSuccess && (
          <p className="text-sm font-semibold text-confirm" role="status">
            Votre formule est maintenant {nameOf(contractTier)}.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {billing.tiers.map((tier) => (
            <div key={tier.id} className={`flex flex-col gap-2 border p-4 ${tier.id === contractTier ? 'border-text-primary' : 'border-border'}`}>
              <h2 className="font-semibold text-text-primary">{tier.nom}</h2>
              <p className="tabular-nums text-text-primary">{tier.prix_mensuel_fcfa === 0 ? 'Gratuit' : `${formatFcfa(tier.prix_mensuel_fcfa)} / mois`}</p>
              <ul className="flex flex-col gap-1 text-sm text-text-secondary">
                {tier.fonctionnalites.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {tier.id === contractTier ? (
                <span className="mt-auto text-xs font-semibold text-text-secondary">
                  {reason === 'essai' ? 'Votre formule après l’essai' : 'Votre formule'}
                </span>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-auto"
                  onClick={() => {
                    change.reset()
                    setTarget(tier)
                  }}
                >
                  Passer à {tier.nom}
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
      {target && (
        <Modal
          title={`Passer à ${target.nom} ?`}
          description={`${target.nom} : ${price(target)}. Le changement s’applique tout de suite ; le paiement en ligne n’est pas encore ouvert.`}
          onClose={() => setTarget(null)}
          actions={
            <>
              <Button type="button" variant="outline" onClick={() => setTarget(null)} disabled={change.isPending}>
                Annuler
              </Button>
              <Button type="button" loading={change.isPending} onClick={() => change.mutate(target.id, { onSuccess: () => setTarget(null) })}>
                Passer à {target.nom}
              </Button>
            </>
          }
        >
          <p className="text-sm text-text-secondary">
            Vous passez de {nameOf(contractTier)} à {target.nom}. Si la nouvelle formule permet moins d’appareils ou de logements que vous n’en avez,
            le changement est refusé et nous vous disons quoi retirer.
          </p>
          <MutationError error={change.error} />
        </Modal>
      )}
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
