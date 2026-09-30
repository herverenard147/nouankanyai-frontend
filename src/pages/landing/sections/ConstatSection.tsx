import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { LANDING_CHARTS } from '@/data/landingCharts'

export function ConstatSection() {
  return (
    <section id="probleme" className="border-y border-border bg-bg-elevated py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid items-end gap-8 lg:grid-cols-[6fr_5fr] lg:gap-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
            Un poste de coût qui pèse plus lourd, rarement piloté avec la même rigueur
          </h2>
          <p className="text-text-secondary">
            Ménage, commerce ou site industriel : l&rsquo;électricité prend une part croissante des charges, le plus
            souvent sans vision claire de qui consomme quoi, ni de ce qui peut réellement être évité. Nouankany donne
            à chaque acteur une lecture structurée de sa consommation, pour décider avec des chiffres plutôt qu&rsquo;à
            l&rsquo;aveugle sur la seule facture mensuelle.
          </p>
        </div>

        <div className="mt-14 grid border-t border-text-primary lg:mt-16 lg:grid-cols-3">
          {LANDING_CHARTS.map((chart) => {
            const bars: ChartBar[] = chart.bars.map((bar, i) => ({
              key: `${chart.id}-${i}`,
              x: bar.x,
              percent: Math.round(((bar.value - chart.min) / (chart.max - chart.min)) * 100),
              tip: bar.tip,
            }))
            return (
              <div
                key={chart.id}
                className="border-b border-border py-8 last:border-b-0 lg:border-b-0 lg:border-l lg:px-8 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <p className="font-heading text-[clamp(2.75rem,5vw,4rem)] font-bold leading-none tracking-[-0.03em] text-text-primary">
                  {chart.headline}
                </p>
                <p className="mb-6 mt-3 text-text-secondary">{chart.label}</p>
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
