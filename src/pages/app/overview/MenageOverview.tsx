import { Link } from 'react-router-dom'

import { AdviceList } from '@/components/advice/AdviceList'
import { AlertSection } from '@/components/alerts/AlertSection'
import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { TariffSection } from '@/components/tariff/TariffSection'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { OcrFieldList } from '@/components/upload/OcrFieldList'
import { useInvoices } from '@/hooks/queries/useInvoices'

export function MenageOverview() {
  const invoicesQuery = useInvoices('menage')
  const latestInvoice = invoicesQuery.data?.[0]

  return (
    <div className="flex flex-col gap-7">
      <AlertSection profile="menage" />
      <KpiGrid profile="menage" />
      <TariffSection profile="menage" />
      <PredictionPanel profile="menage" />
      <AdviceList profile="menage" />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-section-title font-semibold text-text-primary">Dernière facture CIE</h2>
          <Link to="/app/factures" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
            Voir toutes les factures
          </Link>
        </div>
        <Card className="p-5">
          <MetricState status={invoicesQuery.status} isEmpty={!latestInvoice}>
            {latestInvoice && <OcrFieldList fields={latestInvoice.fields} />}
          </MetricState>
        </Card>
      </section>
    </div>
  )
}
