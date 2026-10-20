import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { TimeChart, type TimeSeries } from '@/components/charts/TimeChart'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { SERIES_COLORS } from '@/lib/chartColors'
import { formatFcfa, formatNumberFr } from '@/lib/formatters'
import type { BackendConsumption, BackendConsumptionHabits, BackendConsumptionProvenance, ConsumptionGranularity } from '@/types/backend'
import type { Provenance } from '@/types/domain'

/**
 * Nouvelle vue de Conso & coûts (maquettes validées le 2026-10-20) : courbe avec aire et plages CIE, « qui
 * consomme quoi » empilé ou superposé, coût de chaque appareil, habitudes jour × heure. Mêmes données que
 * l'ancienne vue, qui reste disponible.
 */
const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const X_LABEL: Record<ConsumptionGranularity, string> = { hour: 'Heure', day: 'Jour', week: 'Semaine', month: 'Mois' }
const PROVENANCE: Record<BackendConsumptionProvenance, Provenance> = {
  mesure: 'mesure',
  declare: 'declare',
  demonstration: 'demonstration',
  simulation: 'synthetique',
}
const TARIFF_COLOR = { creuses: 'var(--color-tariff-creuses)', pleines: 'var(--color-tariff-pleines)', pointe: 'var(--color-tariff-pointe)' } as const
const TARIFF_LABEL = { creuses: 'Heures creuses (23 h à 7 h)', pleines: 'Heures pleines (7 h à 19 h)', pointe: 'Pointe (19 h à 23 h)' } as const

function plage(hour: number): keyof typeof TARIFF_COLOR {
  if (hour >= 19 && hour < 23) return 'pointe'
  if (hour >= 7 && hour < 19) return 'pleines'
  return 'creuses'
}

/** Plages CIE en fond de la courbe horaire : un fond par suite d'heures de la même plage. */
function tariffBands(starts: string[]) {
  const bands: { from: number; to: number; color: string; key: keyof typeof TARIFF_COLOR }[] = []
  starts.forEach((iso, i) => {
    const key = plage(new Date(iso).getUTCHours())
    const last = bands[bands.length - 1]
    if (last && last.key === key) last.to = i
    else bands.push({ from: i, to: i, color: TARIFF_COLOR[key], key })
  })
  return bands
}

export function ConsumptionNewView({
  data,
  window,
  granularity,
  technical,
  single,
  children,
}: {
  data: BackendConsumption
  window: string
  granularity: ConsumptionGranularity
  technical: boolean
  single: boolean
  /** Sections communes aux deux vues (tarif, factures), affichées à la fin. */
  children?: ReactNode
}) {
  const hasReadings = data.total.points.some((p) => p !== null)
  const measured = data.total.points.flatMap((p, i) => (p === null ? [] : [i]))
  const lastIndex = measured[measured.length - 1]
  // Un point seul ne trace pas de courbe, et une courbe qui s'arrête tôt semble cassée : on dit pourquoi
  // (vu en production le 2026-10-20 : compte sans relevé depuis deux jours, un seul point en vue Heure et Mois).
  const coverageNote =
    !hasReadings || lastIndex === undefined
      ? null
      : measured.length === 1
        ? `Une seule période de cette fenêtre a des relevés (${data.labels[lastIndex]}) : la courbe se dessinera avec les relevés suivants.`
        : lastIndex < data.labels.length - 2
          ? `Aucun relevé depuis ${data.labels[lastIndex]} : la courbe s’arrête là.`
          : null
  const byHour = granularity === 'hour' && data.tarif.kind === 'plages_horaires'
  const bands = byHour ? tariffBands(data.starts) : []
  const name = data.machines[0]?.nom ?? 'appareil'

  return (
    <div className="flex flex-col gap-7">
      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Consommation, {window}</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-text-secondary">Énergie consommée</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatNumberFr(data.total.kwh, data.total.kwh < 100 ? 1 : 0)} kWh</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Coût estimé</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatFcfa(data.total.cout_fcfa)}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-secondary">Temps couvert par des relevés</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatNumberFr(data.total.couverture_pct, 0)} %</dd>
          </div>
        </dl>
        <TimeChart
            labels={data.labels}
            series={[{ name: `Consommation, ${single ? name : 'tout le compte'}`, values: data.total.points, color: 'var(--color-accent)', kind: 'area' }]}
            unit="kWh"
            yAxisLabel={`Énergie (kWh par ${X_LABEL[granularity].toLowerCase()})`}
            xAxisLabel={X_LABEL[granularity]}
            height={300}
            bands={bands}
            legendExtra={byHour ? (['creuses', 'pleines', 'pointe'] as const).map((k) => ({ label: TARIFF_LABEL[k], swatch: 'box' as const, color: TARIFF_COLOR[k] })) : []}
            emptyMessage={
              <>
                Aucun relevé sur cette période : la courbe reste vide, rien n’est inventé. Reliez un boîtier ou{' '}
                <Link to="/app/parametres" className="font-semibold text-accent-cta hover:underline">
                  importez des relevés
                </Link>
                .
              </>
            }
            extraTip={(i) => (data.total.couts[i] === null ? null : `Coût : ${formatFcfa(data.total.couts[i] as number)}`)}
          />
        {coverageNote && <p className="text-sm font-semibold text-text-primary">{coverageNote}</p>}
        <p className="text-xs text-text-secondary">{data.prix_note}</p>
      </section>

      {!single && data.machines.length > 1 && <WhoUsesWhat data={data} granularity={granularity} window={window} />}

      {data.machines.length > 0 && <CostPerDevice data={data} technical={technical} />}

      <Habits habits={data.habitudes ?? null} withTariff={data.tarif.kind === 'plages_horaires'} />

      {children}
    </div>
  )
}

function WhoUsesWhat({ data, granularity, window }: { data: BackendConsumption; granularity: ConsumptionGranularity; window: string }) {
  const [stacked, setStacked] = useState(true)
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  // Le plus gros consommateur en bas de la pile ; une couleur fixe par appareil, cochée ou non.
  const devices = [...data.machines].sort((a, b) => b.kwh - a.kwh).map((m, i) => ({ ...m, color: SERIES_COLORS[i % SERIES_COLORS.length] }))
  const series: TimeSeries[] = devices.filter((d) => !hidden[d.code]).map((d) => ({ name: d.nom, values: d.points, color: d.color, kind: 'line' }))
  // Échelle fixe, calculée sur tous les appareils : cocher ou décocher l'un d'eux ne change pas la hauteur des autres.
  const n = data.labels.length
  const maxValue = stacked
    ? Math.max(0, ...Array.from({ length: n }, (_, i) => devices.reduce((sum, d) => sum + (d.points[i] ?? 0), 0)))
    : Math.max(0, ...devices.flatMap((d) => d.points.filter((v): v is number => v !== null)))

  return (
    <section className={SECTION}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Qui consomme quoi, {window}</h2>
        <fieldset className="flex border border-border">
          <legend className="sr-only">Affichage</legend>
          {(
            [
              [true, 'Empilé'],
              [false, 'Superposé'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={stacked === value}
              onClick={() => setStacked(value)}
              className={`focus-ring min-h-10 px-4 text-sm font-semibold ${stacked === value ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
            >
              {label}
            </button>
          ))}
        </fieldset>
      </div>
      {series.length ? (
        <TimeChart
          labels={data.labels}
          series={series}
          unit="kWh"
          yAxisLabel={`Énergie (kWh par ${X_LABEL[granularity].toLowerCase()})`}
          xAxisLabel={X_LABEL[granularity]}
          height={300}
          stacked={stacked}
          maxValue={maxValue}
          showLegend={false}
          emptyMessage="Aucun relevé de vos appareils sur cette période : rien à répartir pour l’instant."
        />
      ) : (
        <p className="text-sm text-text-secondary">Cochez au moins un appareil.</p>
      )}
      <fieldset className="flex flex-wrap gap-x-5 gap-y-1">
        <legend className="sr-only">Appareils affichés</legend>
        {devices.map((d) => (
          <label key={d.code} className="flex min-h-8 items-center gap-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={!hidden[d.code]}
              onChange={() => setHidden((h) => ({ ...h, [d.code]: !h[d.code] }))}
              className="h-4 w-4 accent-text-primary"
            />
            <span className="inline-block h-3 w-3" style={{ background: d.color }} />
            {d.nom}
          </label>
        ))}
      </fieldset>
      <p className="text-sm text-text-secondary">
        {stacked
          ? 'Empilé : la hauteur totale est la consommation de tout le compte ; chaque bande de couleur est la part d’un appareil.'
          : 'Superposé : chaque courbe montre un appareil seul, mesuré depuis zéro.'}{' '}
        L’échelle reste la même quand vous cochez ou décochez un appareil.
      </p>
    </section>
  )
}

function CostPerDevice({ data, technical }: { data: BackendConsumption; technical: boolean }) {
  const totalCost = data.machines.reduce((sum, m) => sum + m.cout_fcfa, 0)
  const rows = [...data.machines].sort((a, b) => b.cout_fcfa - a.cout_fcfa)
  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Ce que coûte chaque appareil</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="py-2 font-medium">Appareil</th>
              <th className="py-2 pl-3 text-right font-medium">kWh</th>
              <th className="py-2 pl-3 text-right font-medium">Coût estimé</th>
              <th className="hidden py-2 pl-3 font-medium sm:table-cell">Part du coût</th>
              {technical && <th className="hidden py-2 pl-3 text-right font-medium sm:table-cell">Temps couvert</th>}
              <th className="hidden py-2 pl-3 text-right font-medium sm:table-cell">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const share = totalCost > 0 ? (100 * m.cout_fcfa) / totalCost : 0
              return (
                <tr key={m.code} className="border-b border-border">
                  <td className="py-2 text-text-primary">{m.nom}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">{formatNumberFr(m.kwh, m.kwh < 100 ? 1 : 0)}</td>
                  <td className="whitespace-nowrap py-2 pl-3 text-right font-semibold tabular-nums">{formatFcfa(m.cout_fcfa)}</td>
                  <td className="hidden py-2 pl-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 bg-bg-elevated" aria-hidden="true">
                        <div className="h-full bg-accent" style={{ width: `${share.toFixed(1)}%` }} />
                      </div>
                      <span className="tabular-nums">{formatNumberFr(share, 0)} %</span>
                    </div>
                  </td>
                  {technical && <td className="hidden py-2 pl-3 text-right tabular-nums sm:table-cell">{formatNumberFr(m.couverture_pct, 0)} %</td>}
                  <td className="hidden py-2 pl-3 text-right sm:table-cell">
                    {m.provenance ? <ProvenanceBadge value={PROVENANCE[m.provenance]} /> : <span className="text-xs text-text-secondary">aucun relevé</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/** Blanc cassé vers l'accent puis vers le brun foncé, selon la part du maximum. */
function heatColor(ratio: number): string {
  const a = [250, 250, 249]
  const b = [232, 89, 12]
  const c = [122, 44, 5]
  const t = Math.min(1, Math.max(0, ratio))
  const mix = t < 0.7 ? a.map((v, i) => Math.round(v + (b[i] - v) * (t / 0.7))) : b.map((v, i) => Math.round(v + (c[i] - v) * ((t - 0.7) / 0.3)))
  return `rgb(${mix.join(',')})`
}

function Habits({ habits, withTariff }: { habits: BackendConsumptionHabits | null; withTariff: boolean }) {
  // Sans relevé sur 4 semaines : la grille reste affichée, vide, avec la raison.
  const kw = habits?.kw ?? Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => null as number | null))
  const weeks = habits?.semaines ?? 4
  const max = Math.max(0.0001, ...kw.flat().filter((v): v is number => v !== null))
  const scale = [0, 0.25, 0.5, 0.75, 1].map((r) => ({ ratio: r, kw: r * max }))
  return (
    <section className={SECTION}>
      <h2 className="text-section-title font-semibold text-text-primary">Habitudes : puissance moyenne par jour et par heure, {weeks} dernières semaines</h2>
      {!habits && (
        <p className="text-sm font-semibold text-text-primary">Aucun relevé sur les {weeks} dernières semaines : la grille se remplira dès que vos appareils enverront des relevés.</p>
      )}
      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            {withTariff && (
              <tr aria-hidden="true">
                <td />
                {Array.from({ length: 24 }, (_, h) => (
                  <td key={h} className="h-2 p-0" style={{ background: TARIFF_COLOR[plage(h)] }} />
                ))}
              </tr>
            )}
            <tr>
              <th className="sr-only">Jour</th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} scope="col" className="min-w-7 p-0 text-center font-mono text-mono-axis font-normal text-text-tertiary">
                  {h % 3 === 0 ? `${h} h` : <span className="sr-only">{h} h</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kw.map((row, d) => (
              <tr key={DAYS[d]}>
                <th scope="row" className="pr-2 text-left text-sm font-semibold text-text-primary">
                  {DAYS[d].slice(0, 3)}.
                </th>
                {row.map((v, h) => (
                  <td
                    key={h}
                    title={`${DAYS[d]} ${h} h : ${v === null ? 'aucune mesure' : `${formatNumberFr(v, 1)} kW`}`}
                    className="h-8 min-w-7 p-0"
                    style={{ background: v === null ? 'var(--color-placeholder-2)' : heatColor(v / max) }}
                  >
                    <span className="sr-only">{v === null ? 'aucune mesure' : `${formatNumberFr(v, 1)} kW`}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-text-secondary">
        {habits && (
          <span className="flex items-center gap-2">
            Puissance moyenne :
            {scale.map((s) => (
              <span key={s.ratio} className="flex items-center gap-1">
                <span className="inline-block h-3.5 w-7 border border-placeholder-border" style={{ background: heatColor(s.ratio) }} />
                {formatNumberFr(s.kw, s.kw < 10 ? 1 : 0)} kW
              </span>
            ))}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block h-3.5 w-7" style={{ background: 'var(--color-placeholder-2)' }} />
          aucune mesure
        </span>
        {withTariff &&
          (['creuses', 'pleines', 'pointe'] as const).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className="inline-block h-2 w-5" style={{ background: TARIFF_COLOR[k] }} />
              {TARIFF_LABEL[k]}
            </span>
          ))}
      </div>
    </section>
  )
}
