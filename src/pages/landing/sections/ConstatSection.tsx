import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { LANDING_CHARTS } from '@/data/landingCharts'

export function ConstatSection() {
  return (
    <section id="probleme" className="py-16">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-10 flex max-w-[60ch] flex-col gap-2">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Le constat économique
          </p>
          <h2 className="text-h2-section font-bold text-text-primary">
            Un poste de coût qui pèse plus lourd, rarement piloté avec la même rigueur
          </h2>
          <p className="text-small-body text-text-secondary">
            Ménage, commerce ou site industriel : l&rsquo;électricité prend une part croissante des charges, le plus
            souvent sans vision claire de qui consomme quoi, ni de ce qui peut réellement être évité. Nouankany donne
            à chaque acteur une lecture structurée de sa consommation, pour décider avec des chiffres plutôt qu&rsquo;à
            l&rsquo;aveugle sur la seule facture mensuelle.
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
                  <p className="text-right font-mono text-caption text-text-secondary">{chart.axisY}</p>
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
