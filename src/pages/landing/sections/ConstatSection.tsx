import { LANDING_CHARTS } from '@/data/landingCharts'

// Barres de la grille tarifaire : une teinte par palier, du plus bas au plus haut.
const PALIER_COLORS = ['bg-text-tertiary', 'bg-[#c9651e]', 'bg-accent']

// Certaines sources portent déjà le préfixe « source : » dans les données.
const sourceText = (source: string) => `source : ${source.replace(/^source\s*:\s*/i, '')}`

export function ConstatSection() {
  const tarif = LANDING_CHARTS.find((chart) => chart.id === 'tarif')
  const ecart = LANDING_CHARTS.find((chart) => chart.id === 'ecart')
  const demande = LANDING_CHARTS.find((chart) => chart.id === 'demande')
  if (!tarif || !ecart || !demande) return null

  return (
    <section id="probleme" className="border-y border-border bg-bg-elevated py-20 lg:py-28">
      <div className="mx-auto max-w-[75rem] px-6">
        <div className="grid items-end gap-8 lg:grid-cols-[6fr_5fr] lg:gap-16">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
            L&rsquo;électricité coûte de plus en plus cher. Vous la pilotez&nbsp;?
          </h2>
          <p className="text-text-secondary">
            Qui consomme quoi, et qu&rsquo;est-ce qui peut être évité&nbsp;? Nouankany vous le montre, chiffres à
            l&rsquo;appui, au lieu d&rsquo;une simple facture en fin de mois.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-10 md:grid-cols-[5fr_6fr] lg:mt-16 lg:gap-[4.5rem]">
          <div className="flex flex-col gap-10">
            {[tarif, demande].map((chart) => (
              <div key={chart.id} className="border-t-2 border-text-primary pt-5">
                <p className="font-heading text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-none tracking-[-0.03em] text-text-primary">
                  {chart.headline}
                </p>
                <p className="mt-2.5 text-text-secondary">{chart.label}</p>
                <p className="mt-2 font-mono text-[0.75rem] text-text-secondary">{sourceText(chart.source)}</p>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-text-primary pt-5">
            <p className="font-heading text-[clamp(2.75rem,5vw,4.5rem)] font-bold leading-none tracking-[-0.03em] text-text-primary">
              {ecart.headline}
            </p>
            <p className="mt-2.5 text-text-secondary">{ecart.label}</p>
            <ul className="mt-7 flex flex-col gap-3.5">
              {ecart.bars.map((bar, index) => (
                <li key={bar.x} className="grid grid-cols-[5.5rem_1fr_3.75rem] items-center gap-4">
                  <span className="font-semibold text-text-primary">{bar.x}</span>
                  <span className="block h-10 bg-border" aria-hidden="true">
                    <span
                      className={`block h-full ${PALIER_COLORS[index] ?? 'bg-accent'}`}
                      style={{ width: `${(bar.value / ecart.max) * 100}%` }}
                    />
                  </span>
                  <span className="font-mono text-sm text-text-primary">{bar.tip.replace('indice ', '')}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[0.75rem] text-text-secondary">
              {sourceText(ecart.source)} · {ecart.axisY}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
