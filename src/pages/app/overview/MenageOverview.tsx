import { Link } from 'react-router-dom'

import { AlertsSummary } from '@/components/overview/AlertsSummary'
import { KpiStrip } from '@/components/overview/KpiStrip'
import { PredictionSummary } from '@/components/overview/PredictionSummary'
import { ShortcutList } from '@/components/overview/ShortcutList'
import { useShortcutCatalog } from '@/components/overview/useShortcutCatalog'
import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { MetricState } from '@/components/state/MetricState'
import { OcrFieldList } from '@/components/upload/OcrFieldList'
import { useInvoices } from '@/hooks/queries/useInvoices'
import { kpiTargets, menageOverviewBlocks } from '@/lib/overviewLevels'

/**
 * Vue d'ensemble MÉNAGE : le gabarit le plus court. Ménage n'a pas de sélecteur de niveau (toujours « débutant »).
 * Le Ménage paie un abonnement par palier (Découverte gratuit, Essentiel, Optimum) : son raccourci mène à la page Abonnement.
 */
export function MenageOverview() {
  const invoicesQuery = useInvoices('menage')
  const latestInvoice = invoicesQuery.data?.[0]
  const catalog = useShortcutCatalog('menage')
  const blocks = menageOverviewBlocks()

  return (
    <div className="flex flex-col gap-5">
      <DemoDataBanner />
      <p className="text-sm text-text-secondary">
        Vue d&rsquo;ensemble de votre foyer : consommation, prédiction et dernière facture CIE en un coup d&rsquo;œil.
      </p>

      <KpiStrip profile="menage" targets={kpiTargets('menage')} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <PredictionSummary profile="menage" />
        <AlertsSummary profile="menage" max={2} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <section aria-label="Dernière facture CIE" className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-base font-bold text-text-primary">Dernière facture CIE</h2>
            <Link to="/app/factures" className="focus-ring text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover">
              Toutes les factures →
            </Link>
          </div>
          <MetricState status={invoicesQuery.status} isEmpty={!latestInvoice}>
            {latestInvoice && <OcrFieldList fields={latestInvoice.fields} />}
          </MetricState>
        </section>
        <ShortcutList items={blocks.shortcuts.map((id) => catalog[id])} />
      </div>
    </div>
  )
}
