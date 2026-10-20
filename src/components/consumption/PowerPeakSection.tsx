import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { rawPowerPeak } from '@/api/rawBackend'
import { TimeChart } from '@/components/charts/TimeChart'
import { MetricState } from '@/components/state/MetricState'
import { formatNumberFr } from '@/lib/formatters'
import { DAY_MS, shortDate } from '@/lib/timeline'
import type { BackendSitePeak } from '@/types/backend'

/**
 * Pic de puissance (maquette validée, 2026-10-20) : la plus forte puissance moyenne tenue 10 min, 15 min et 1 h
 * de la journée, site par site, face à la puissance souscrite. La CIE ne publie pas la durée sur laquelle elle
 * mesure la « puissance maximale atteinte » : les trois sont montrées, la facture dit laquelle compte.
 */
const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const ALERT = 'var(--color-alert)'
const WINDOW_LABEL: Record<string, string> = { '10': 'Pic tenu 10 min', '15': 'Pic tenu 15 min', '60': 'Pic tenu 1 h' }

/** « 2026-10-19T10:45:00 » → « 10 h 45 » (heure d'Abidjan = temps universel). */
function clock(iso: string): string {
  const [h, m] = iso.slice(11, 16).split(':')
  return `${Number(h)} h ${m}`
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** `fixedDay` : le jour choisi en haut de la page (« Jour précis ») ; les boutons de jour sont alors masqués. */
export function PowerPeakSection({ fixedDay }: { fixedDay?: string } = {}) {
  const today = Math.floor(Date.now() / DAY_MS) * DAY_MS
  const days = Array.from({ length: 7 }, (_, k) => today - k * DAY_MS)
  const [chosen, setDay] = useState(isoDay(today))
  const day = fixedDay ?? chosen
  const query = useQuery({ queryKey: ['power-peak', day], queryFn: () => rawPowerPeak(day) })

  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Pic de puissance face à la puissance souscrite</h2>
      {!fixedDay && (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Jour</legend>
          {days.map((d, k) => (
            <button
              key={d}
              type="button"
              aria-pressed={day === isoDay(d)}
              onClick={() => setDay(isoDay(d))}
              className={`focus-ring min-h-10 rounded-pill border px-4 text-sm font-semibold ${day === isoDay(d) ? 'border-text-primary bg-text-primary text-white' : 'border-border bg-card text-text-primary hover:bg-bg-elevated'}`}
            >
              {k === 0 ? 'Aujourd’hui' : k === 1 ? 'Hier' : shortDate(d)}
            </button>
          ))}
        </fieldset>
      )}
      <MetricState status={query.status} isEmpty={query.data?.sites.length === 0}>
        {query.data?.sites.map((site) => <SitePeak key={site.site_id ?? 'sans-site'} site={site} ongoing={query.data.en_cours} />)}
      </MetricState>
      <p className="text-xs text-text-secondary">
        Pic tenu : la plus forte puissance moyenne gardée pendant toute la durée. La CIE ne publie pas la durée sur laquelle elle mesure votre « puissance
        maximale atteinte » : comparez ces trois valeurs à celle de votre facture.
      </p>
    </section>
  )
}

function SitePeak({ site, ongoing }: { site: BackendSitePeak; ongoing: boolean }) {
  const limit = site.souscription?.kw ?? null
  const labels = Array.from({ length: 96 }, (_, q) => `${Math.floor(q / 4)} h ${String((q % 4) * 15).padStart(2, '0')}`)
  const ticks = labels.map((_, q) => (q % 12 === 0 ? `${q / 4} h` : null))
  const hasData = site.quarts_kw.some((v) => v !== null)
  const spacing = site.ecart_releves_min

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-text-primary">{site.site_nom}</h3>
        <span className="text-xs text-text-secondary">
          {site.source === 'compteur_general'
            ? 'Mesuré au compteur général du site.'
            : `Somme de ${site.appareils} appareil${site.appareils > 1 ? 's' : ''} suivi${site.appareils > 1 ? 's' : ''} : un appareil sans relevé n’y figure pas.`}
        </span>
      </div>
      <dl className="grid gap-3 sm:grid-cols-4">
        {(['10', '15', '60'] as const).map((w) => {
          const p = site.pics[w]
          const over = p && limit !== null && p.kw > limit
          return (
            <div key={w} className={`border p-3 ${over ? 'border-alert bg-alert-bg' : 'border-border bg-card'}`}>
              <dt className="text-sm text-text-secondary">{WINDOW_LABEL[w]}</dt>
              {p ? (
                <dd className={`text-xl font-semibold tabular-nums ${over ? 'text-alert' : 'text-text-primary'}`}>
                  {formatNumberFr(p.kw, p.kw < 10 ? 1 : 0)} kW <span className="text-sm font-medium text-text-secondary">à {clock(p.debut)}</span>
                </dd>
              ) : (
                <dd className="text-sm text-text-secondary">
                  {!hasData ? 'aucun relevé' : spacing !== null ? `relevés trop espacés (un toutes les ${formatNumberFr(spacing, 0)} min)` : 'pas assez de relevés'}
                </dd>
              )}
            </div>
          )
        })}
        <div className="border border-border bg-card p-3">
          <dt className="text-sm text-text-secondary">Puissance souscrite</dt>
          {site.souscription ? (
            <dd className="text-xl font-semibold tabular-nums text-text-primary">
              {formatNumberFr(site.souscription.kw, Number.isInteger(site.souscription.kw) ? 0 : 1)} kW
              {site.souscription.unite !== 'kW' && (
                <span className="block text-xs font-medium text-text-secondary">
                  {formatNumberFr(site.souscription.valeur, 1)} {site.souscription.unite}, cos φ {String(site.souscription.cos_phi).replace('.', ',')}
                </span>
              )}
            </dd>
          ) : (
            <dd className="text-sm text-text-secondary">
              non renseignée :{' '}
              <Link to="/app/parametres" className="font-semibold text-accent-cta hover:underline">
                la saisir dans Paramètres
              </Link>
            </dd>
          )}
        </div>
      </dl>
      <TimeChart
        labels={labels}
        ticks={ticks}
        series={[{ name: 'Puissance moyenne du quart d’heure', values: site.quarts_kw, color: 'var(--color-accent)', kind: 'area' }]}
        unit="kW"
        yAxisLabel="Puissance (kW, moyenne de chaque quart d’heure)"
        xAxisLabel="Heure"
        height={260}
        refLines={limit !== null ? [{ value: limit, label: `Puissance souscrite ${formatNumberFr(limit, Number.isInteger(limit) ? 0 : 1)} kW`, color: ALERT }] : []}
        bands={site.depassements.map((d) => {
          const from = Number(d.debut.slice(11, 13)) * 4 + Number(d.debut.slice(14, 16)) / 15
          return { from, to: Math.min(95, from + d.minutes / 15 - 1), color: 'var(--color-alert-bg)' }
        })}
        legendExtra={site.depassements.length ? [{ label: 'Au-dessus de la puissance souscrite', swatch: 'box', color: 'var(--color-alert-bg)' }] : []}
        emptyMessage="Aucun relevé ce jour-là : la courbe reste vide, rien n’est inventé."
      />
      {limit !== null && hasData && (
        <p className={`text-sm ${site.depassements.length ? 'font-semibold text-alert' : 'text-confirm'}`}>
          {site.depassements.length
            ? `Dépassement de la puissance souscrite : ${site.depassements
                .map((d) => `de ${clock(d.debut)} à ${clock(d.fin)} (${d.minutes} min), jusqu’à ${formatNumberFr(d.max_kw, 0)} kW`)
                .join(' ; ')}.`
            : `Aucun dépassement de la puissance souscrite ${ongoing ? 'pour l’instant aujourd’hui' : 'ce jour-là'}.`}
        </p>
      )}
    </div>
  )
}
