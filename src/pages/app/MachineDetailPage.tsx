import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { rawApplianceDetail } from '@/api/rawBackend'
import { TimeChart } from '@/components/charts/TimeChart'
import { MetricState } from '@/components/state/MetricState'
import { useAlertRegistry } from '@/hooks/queries/useAlertRegistry'
import { LOCKED, LockedFeature } from '@/components/billing/LockedFeature'
import { useAccess } from '@/hooks/queries/useBilling'
import { usePredictionsBundle } from '@/hooks/queries/usePrediction'
import { resolutionLabel } from '@/lib/alertRegistry'
import { formatFcfa, formatNumberFr, formatUtcDateTime } from '@/lib/formatters'
import { hourlyDecor, shortDate } from '@/lib/timeline'
import { useBreadcrumbLabel } from '@/store/breadcrumbStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendApplianceDetail } from '@/types/backend'

/**
 * Page d'un appareil (maquette validée par le propriétaire, 2026-10-20) : chiffres de la période, courbes de chaque
 * mesure face aux seuils de l'appareil, kWh par jour face à l'attendu, habitude, prévision et alertes.
 */
const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const ALERT = 'var(--color-alert)'
const PERIODS = [
  ['24h', '24 h'],
  ['7j', '7 jours'],
  ['30j', '30 jours'],
] as const
type Period = (typeof PERIODS)[number][0]

/** Étiquettes sous l'axe : l'heure en vue 24 h, la date chaque jour (7 j) ou tous les 5 jours (30 j). */
function axisTicks(d: BackendApplianceDetail): { labels: string[]; ticks: (string | null)[] } {
  const at = d.starts.map((s) => Date.parse(`${s}Z`))
  const labels = at.map((t) => `${shortDate(t)}, ${new Date(t).getUTCHours()} h${String(new Date(t).getUTCMinutes()).padStart(2, '0')}`)
  const ticks = at.map((t) => {
    const date = new Date(t)
    const h = date.getUTCHours()
    const m = date.getUTCMinutes()
    if (d.periode === '24h') return m === 0 && h % 3 === 0 ? `${h} h` : null
    if (h !== 0) return null
    return d.periode === '7j' || date.getUTCDate() % 5 === 0 ? shortDate(t) : null
  })
  return { labels, ticks }
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums text-text-primary">{value}</dd>
      {sub && <dd className="text-xs text-text-secondary">{sub}</dd>}
    </div>
  )
}

export function MachineDetailPage() {
  const { code = '' } = useParams()
  const profile = useSessionStore((s) => s.session?.profile) ?? 'industrie'
  const [period, setPeriod] = useState<Period>('7j')
  const query = useQuery({ queryKey: ['appliance-detail', code, period], queryFn: () => rawApplianceDetail(code, period) })
  const forecast = usePredictionsBundle(profile, 'heure')
  const access = useAccess()
  // Appareil hors de ceux que la formule prévoit (2026-10-21) : on le dit au lieu d'un graphique vide.
  const forecastLocked = access.loaded && (!access.predictions || (access.predicted !== null && !access.predicted.includes(code ?? '')))
  const alerts = useAlertRegistry('toutes')
  useBreadcrumbLabel(query.data?.nom)

  const d = query.data
  const device = forecast.data?.perDevice.find((p) => p.code === code)
  const mine = (alerts.data ?? []).filter((a) => a.machine_code === code).slice(0, 8)

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-section-title font-semibold text-text-primary">{d?.nom ?? 'Appareil'}</h2>
          {d && (
            <p className="text-sm text-text-secondary">
              {d.categorie ?? 'Catégorie non renseignée'}
              {d.puissance_nominale_kw ? ` · ${formatNumberFr(d.puissance_nominale_kw, 1)} kW de puissance nominale` : ''}
              {d.derniere_mesure_at ? ` · dernier relevé le ${formatUtcDateTime(d.derniere_mesure_at)}` : ' · aucun relevé'}
            </p>
          )}
        </div>
        <fieldset className="flex border border-border">
          <legend className="sr-only">Période</legend>
          {PERIODS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={period === id}
              onClick={() => setPeriod(id)}
              className={`focus-ring min-h-10 px-4 text-sm font-semibold ${period === id ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
            >
              {label}
            </button>
          ))}
        </fieldset>
      </div>

      <MetricState status={query.status}>{d && <DetailBody d={d} />}</MetricState>

      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Prévision des 24 prochaines heures</h2>
        {forecastLocked ? (
          <LockedFeature
            title="Prévision de cet appareil"
            message={access.predictions ? `Votre formule prévoit ${access.maxPredictions} appareils, ceux qui consomment le plus ; celui-ci n’en fait pas partie. Optimum en prévoit 4.` : LOCKED.predictions.message}
          />
        ) : (
        <MetricState status={forecast.status} isEmpty={!device}>
          {device && (() => {
            const decor = device.starts?.length === device.series.length ? hourlyDecor(device.starts) : null
            return (
              <>
                <p className="text-sm text-text-secondary">
                  {device.intervalLabel}. Puissance à l’heure qui vient : {device.value} {device.unit}.
                </p>
                <TimeChart
                  labels={decor?.labels ?? device.series.map((p) => p.label)}
                  ticks={decor?.ticks}
                  zones={decor?.zones}
                  separators={decor?.separators}
                  series={[{ name: 'Prévu', values: device.series.map((p) => p.value), color: '#2b6cb0', kind: 'dashed' }]}
                  unit="kW"
                  yAxisLabel="Puissance prévue (kW)"
                  xAxisLabel="Heure"
                  height={220}
                />
              </>
            )
          })()}
        </MetricState>
        )}
      </section>

      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Alertes de cet appareil</h2>
        <MetricState status={alerts.status} isEmpty={mine.length === 0}>
          <ul className="flex flex-col">
            {mine.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-2.5 text-sm">
                <span className="text-text-primary">
                  {a.kind_label ?? a.title} <span className="text-text-secondary">· depuis le {formatUtcDateTime(a.created_at)}</span>
                </span>
                <span className={`text-xs font-semibold ${a.is_open ? 'text-alert' : 'text-text-secondary'}`}>{resolutionLabel(a)}</span>
              </li>
            ))}
          </ul>
        </MetricState>
      </section>
    </div>
  )
}

function DetailBody({ d }: { d: BackendApplianceDetail }) {
  const { labels, ticks } = axisTicks(d)
  const has = (values: (number | null)[]) => values.some((v) => v !== null)
  const periodName = d.periode === '24h' ? 'sur 24 h' : d.periode === '7j' ? 'sur 7 jours' : 'sur 30 jours'
  const empty = 'Aucun relevé sur cette période : la courbe reste vide, rien n’est inventé.'
  const measures = [
    { key: 'temp', title: 'Température', values: d.temperature_c, unit: '°C', axis: 'Température (°C)', limit: d.seuils.temperature_max_c, color: '#805ad5' },
    { key: 'vib', title: 'Vibration', values: d.vibration_mm_s, unit: 'mm/s', axis: 'Vibration (mm/s)', limit: d.seuils.vibration_max_mm_s, color: '#2f855a' },
    { key: 'pres', title: 'Pression', values: d.pression_bar, unit: 'bar', axis: 'Pression (bar)', limit: null, color: '#b7791f' },
  ].filter((m) => has(m.values))
  const dayLabels = d.jours.map((j) => shortDate(Date.parse(`${j.jour}T00:00:00Z`)))

  return (
    <>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Figure label={`Consommé ${periodName}`} value={`${formatNumberFr(d.kwh, d.kwh < 100 ? 1 : 0)} kWh`} sub={`relevés sur ${formatNumberFr(d.couverture_pct, 0)} % du temps`} />
        <Figure label={`Coût ${periodName}`} value={formatFcfa(d.cout_fcfa)} />
        <Figure label="Heures de marche par jour" value={d.heures_marche_par_jour === null ? '-' : `${formatNumberFr(d.heures_marche_par_jour, 1)} h`} sub="au-dessus de 10 % de sa puissance nominale" />
        <Figure
          label="Écart à l’attendu"
          value={d.ecart_attendu_pct === null ? '-' : `${d.ecart_attendu_pct > 0 ? '+' : ''}${formatNumberFr(d.ecart_attendu_pct, 0)} %`}
          sub={d.attendu_kwh_jour ? `attendu : ${formatNumberFr(d.attendu_kwh_jour, 1)} kWh par jour (${d.attendu_source})` : 'pas d’attendu connu'}
        />
        <Figure label="Part du compte" value={d.part_compte_pct === null ? '-' : `${formatNumberFr(d.part_compte_pct, 0)} %`} sub={`de l’énergie de tous les appareils, ${periodName}`} />
      </dl>

      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Puissance</h2>
        <TimeChart
          labels={labels}
          ticks={ticks}
          series={[{ name: 'Puissance moyenne', values: d.puissance_kw, color: 'var(--color-accent)', kind: 'area' }]}
          unit="kW"
          yAxisLabel={`Puissance (kW, moyenne de chaque pas de ${d.pas_min >= 60 ? `${d.pas_min / 60} h` : `${d.pas_min} min`})`}
          xAxisLabel={d.periode === '24h' ? 'Heure' : 'Jour'}
          height={260}
          refLines={d.seuils.puissance_kw ? [{ value: d.seuils.puissance_kw, label: `Seuil ${formatNumberFr(d.seuils.puissance_kw, 1)} kW`, color: ALERT }] : []}
          emptyMessage={empty}
        />
      </section>

      {measures.map((m) => (
        <section key={m.key} className={SECTION}>
          <h2 className="text-section-title font-semibold text-text-primary">{m.title}</h2>
          <TimeChart
            labels={labels}
            ticks={ticks}
            series={[{ name: m.title, values: m.values, color: m.color, kind: 'line' }]}
            unit={m.unit}
            yAxisLabel={m.axis}
            xAxisLabel={d.periode === '24h' ? 'Heure' : 'Jour'}
            height={220}
            refLines={m.limit ? [{ value: m.limit, label: `Seuil ${formatNumberFr(m.limit, 1)} ${m.unit}`, color: ALERT }] : []}
          />
        </section>
      ))}

      {d.jours.length > 0 && (
        <section className={SECTION}>
          <h2 className="text-section-title font-semibold text-text-primary">Consommation par jour</h2>
          <TimeChart
            labels={dayLabels}
            series={[{ name: 'Consommé', values: d.jours.map((j) => j.kwh), color: '#2b6cb0', kind: 'area' }]}
            unit="kWh"
            yAxisLabel="Énergie (kWh par jour)"
            xAxisLabel="Jour"
            height={220}
            refLines={d.attendu_kwh_jour ? [{ value: d.attendu_kwh_jour, label: `Attendu ${formatNumberFr(d.attendu_kwh_jour, 0)} kWh`, color: ALERT }] : []}
            extraTip={(i) => `Coût : ${formatFcfa(d.jours[i]?.cout_fcfa ?? 0)}`}
          />
        </section>
      )}

      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Habitude : puissance moyenne par heure, 4 dernières semaines</h2>
        <TimeChart
          labels={Array.from({ length: 24 }, (_, h) => `${h} h`)}
          ticks={Array.from({ length: 24 }, (_, h) => (h % 3 === 0 ? `${h} h` : null))}
          series={[
            { name: 'Jours de semaine', values: d.habitude.semaine, color: 'var(--color-accent)', kind: 'line' },
            { name: 'Week-end', values: d.habitude.weekend, color: '#2b6cb0', kind: 'dashed' },
          ]}
          unit="kW"
          yAxisLabel="Puissance moyenne (kW)"
          xAxisLabel="Heure de la journée"
          height={220}
          emptyMessage="Aucun relevé sur les 4 dernières semaines : l’habitude se dessinera avec les relevés."
        />
      </section>
    </>
  )
}
