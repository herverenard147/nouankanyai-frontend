import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useFacturation } from '@/hooks/queries/useFacturation'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'

/** Commission sur les économies : Nouankany prend 10 % des économies réellement journalisées ce mois. */
export function FacturationPage() {
  const query = useFacturation()

  return (
    <div className="flex flex-col gap-7">
      <p className="text-sm text-text-secondary">
        Détail du calcul de la commission Nouankany sur les économies et piste d&rsquo;audit des économies enregistrées ce
        mois.
      </p>
      <MetricState status={query.status}>
        {query.data && (
          <>
            <div className="grid grid-cols-1 border-y border-border border-t-2 border-t-text-primary sm:grid-cols-2">
              <div className="flex flex-col gap-2 border-b border-border py-4 sm:border-b-0 sm:border-r sm:pr-6">
                <h3 className="text-sm font-medium text-text-secondary">Économies brutes ce mois</h3>
                <p className="font-heading text-kpi-value font-semibold tabular-nums text-text-primary">
                  {formatFcfa(query.data.grossSavings)}
                </p>
                <ProvenanceBadge value="estime" className="w-fit" />
              </div>
              <div className="flex flex-col gap-2 py-4 sm:pl-6">
                <h3 className="text-sm font-medium text-text-secondary">Commission Nouankany (10 %)</h3>
                <p className="font-heading text-kpi-value font-semibold tabular-nums text-text-primary">
                  {formatFcfa(query.data.gainShare)}
                </p>
                <ProvenanceBadge value="estime" className="w-fit" />
              </div>
            </div>

            <section className="flex flex-col gap-4 border-t-2 border-text-primary pt-4">
              <h3 className="text-section-title font-semibold text-text-primary">Économies par semaine</h3>
              <MetricState status="success" isEmpty={query.data.barData.every((bar) => bar.savings === 0)}>
                <BarChartFromFacturation bars={query.data.barData} />
              </MetricState>
            </section>

            <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
              <h3 className="text-section-title font-semibold text-text-primary">Piste d&rsquo;audit</h3>
              <MetricState status="success" isEmpty={query.data.auditTrail.length === 0}>
                <div className="flex flex-col">
                  {query.data.auditTrail.map((entry, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2.5 text-sm">
                      <span className="tabular-nums text-text-tertiary">{new Date(entry.timestamp).toLocaleString('fr-FR')}</span>
                      <span className="min-w-0 flex-1 px-3 text-text-primary">{entry.action}</span>
                      <span className="text-text-secondary">{entry.status}</span>
                    </div>
                  ))}
                </div>
              </MetricState>
            </section>

            <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
              <h3 className="text-section-title font-semibold text-text-primary">Factures de commission</h3>
              <MetricState status="success" isEmpty={query.data.invoices.length === 0}>
                <div className="flex flex-col">
                  {query.data.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2.5 text-sm">
                      <span className="text-text-primary">{invoice.month}</span>
                      <span className="tabular-nums text-text-secondary">{invoice.amount}</span>
                    </div>
                  ))}
                </div>
              </MetricState>
            </section>
          </>
        )}
      </MetricState>
    </div>
  )
}

function BarChartFromFacturation({ bars }: { bars: { name: string; savings: number }[] }) {
  const max = Math.max(...bars.map((b) => b.savings), 1)
  const chartBars: ChartBar[] = bars.map((b) => ({
    key: b.name,
    x: b.name,
    percent: Math.round((b.savings / max) * 100),
    tip: formatFcfa(b.savings),
  }))
  const yTicks = [formatNumberFr(max), formatNumberFr(max / 2), '0']
  return <BarChart bars={chartBars} yTicks={yTicks} size="dashboard" yAxisLabel="FCFA" xAxisLabel="semaine" />
}
