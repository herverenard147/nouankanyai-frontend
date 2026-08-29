import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { LANDING_CHARTS } from '@/data/landingCharts'

export function ConstatSection() {
  return (
    <section id="probleme" className="py-16">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-10 flex max-w-[60ch] flex-col gap-2">
          <p className="font-mono text-[0.78rem] font-semibold uppercase tracking-wide text-text-secondary">
            Le constat
          </p>
          <h2 className="text-h2-section font-bold text-text-primary">Une hausse structurelle, pas un accident</h2>
          <p className="text-[1.02rem] text-text-secondary">
            Le coût de revient de l&rsquo;électricité dépasse déjà le tarif moyen facturé en Côte d&rsquo;Ivoire. De
            nouvelles hausses sont probables. Sans outil de suivi, ménages et entreprises pilotent leur consommation
            à l&rsquo;aveugle, sur la seule base de la facture mensuelle.
          </p>
        </div>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
          {LANDING_CHARTS.map((chart) => {
            const bars: ChartBar[] = chart.bars.map((bar, i) => ({
              key: `${chart.id}-${i}`,
              x: bar.x,
              percent: Math.round(((bar.value - chart.min) / (chart.max - chart.min)) * 100),
              tip: bar.tip,
            }))
            return (
              <div key={chart.id} className="rounded-card border border-border bg-card p-5">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="font-mono text-[1.5rem] font-semibold text-text-primary">{chart.headline}</p>
                  <p className="text-right font-mono text-[0.72rem] text-text-secondary">{chart.axisY}</p>
                </div>
                <p className="mb-3 text-sm text-text-secondary">{chart.label}</p>
                <BarChart
                  bars={bars}
                  yTicks={chart.ticks}
                  size="landing"
                  xAxisLabel={chart.axisX}
                  sourceLabel={chart.source}
                  gapPx={chart.gapPx}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
