import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { rawConsumption } from '@/api/rawBackend'
import { TimeChart } from '@/components/charts/TimeChart'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { formatFcfa } from '@/lib/formatters'
import { DAY_MS, HOUR_MS, hourlyDecor, hourlyPowerKw, mergeTimeline, shortDate, type TimePoint } from '@/lib/timeline'
import type { BackendConsumption } from '@/types/backend'
import type { Prediction, PredictionGranularity, PredictionsBundle } from '@/types/domain'

/**
 * Nouvelle vue de Prédiction (maquettes validées le 2026-10-20) : le mesuré puis le prévu sur la même courbe,
 * séparés par « maintenant ». En vue Heure, les jours sont nommés (Hier, Aujourd’hui, Demain) et chaque minuit est
 * marqué : avant, rien ne permettait de les distinguer. L'ancienne vue reste disponible.
 */
const SECTION = 'flex flex-col gap-4 border-t-2 border-text-primary pt-4'
const MEASURED = 'var(--color-accent)'
const FORECAST = '#2b6cb0'

interface ChartData {
  labels: string[]
  ticks?: (string | null)[]
  past: (number | null)[]
  future: (number | null)[]
  nowIndex?: number
  zones?: { from: number; to: number; label: string }[]
  separators?: number[]
}

/** Mesuré (un appareil, ou tout le compte) placé avant la prévision, au même pas. */
function buildChart(prediction: Prediction, granularity: PredictionGranularity, consumption: BackendConsumption | undefined, code?: string): ChartData {
  const futureStarts = prediction.starts ?? []
  const future: TimePoint[] = prediction.series.map((p, i) => ({ at: futureStarts[i], value: p.value })).filter((p) => p.at !== undefined)
  if (granularity === 'mois' || future.length !== prediction.series.length) {
    return { labels: prediction.series.map((p) => p.label), past: prediction.series.map(() => null), future: prediction.series.map((p) => p.value) }
  }
  const values = code ? consumption?.machines.find((m) => m.code === code)?.points : consumption?.total.points
  const now = Date.now()
  const past: TimePoint[] = (consumption?.starts ?? []).map((iso, i) => {
    const at = Date.parse(iso)
    const kwh = values?.[i] ?? null
    if (granularity === 'heure') return { at, value: hourlyPowerKw(at, kwh, now) }
    // Jour : un jour entamé ferait un creux trompeur ; il est laissé vide.
    return { at, value: at + DAY_MS > now ? null : kwh }
  })
    // Seulement les heures (ou jours) mesurés : sans relevé récent, la courbe commence au premier point utile au
    // lieu d'une longue partie vide (vu en production le 2026-10-20 : dernier relevé deux jours plus tôt).
    .filter((p) => p.value !== null)
  if (granularity === 'heure') {
    const yesterday = (Math.floor(now / DAY_MS) - 1) * DAY_MS
    const line = mergeTimeline(past, future, HOUR_MS, yesterday)
    const decor = hourlyDecor(line.at, now)
    return { labels: decor.labels, ticks: decor.ticks, past: line.past, future: line.future, nowIndex: line.nowIndex, zones: decor.zones, separators: decor.separators }
  }
  const line = mergeTimeline(past, future, DAY_MS, now - 8 * DAY_MS)
  return { labels: line.at.map((t) => shortDate(t)), past: line.past, future: line.future, nowIndex: line.nowIndex }
}

const X_LABEL: Record<PredictionGranularity, string> = {
  heure: 'Heure : hier, aujourd’hui, demain',
  jour: 'Jour : 7 jours mesurés, puis les jours prévus',
  mois: 'Mois',
}

function ForecastChart({ prediction, granularity, consumption, code }: { prediction: Prediction; granularity: PredictionGranularity; consumption?: BackendConsumption; code?: string }) {
  const chart = buildChart(prediction, granularity, consumption, code)
  const hasPast = chart.past.some((v) => v !== null)
  return (
    <TimeChart
      labels={chart.labels}
      ticks={chart.ticks}
      series={[
        ...(hasPast ? [{ name: 'Mesuré', values: chart.past, color: MEASURED, kind: 'area' as const }] : []),
        { name: 'Prévu', values: chart.future, color: FORECAST, kind: 'dashed' as const },
      ]}
      unit={prediction.yAxisUnit}
      yAxisLabel={prediction.yAxisUnit === 'kW' ? 'Puissance (kW)' : `Énergie (kWh par ${granularity === 'jour' ? 'jour' : 'mois'})`}
      xAxisLabel={X_LABEL[granularity]}
      height={320}
      nowIndex={chart.nowIndex}
      zones={chart.zones}
      separators={chart.separators}
    />
  )
}

function Figures({ prediction }: { prediction: Prediction }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <dl className="grid flex-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-text-secondary">{prediction.unit === 'kW' ? 'Puissance prévue à l’heure qui vient' : 'Énergie prévue'}</dt>
          <dd className="text-2xl font-semibold tabular-nums text-text-primary">
            {prediction.value} {prediction.unit}
          </dd>
        </div>
        {prediction.costFcfa !== undefined && (
          <div>
            <dt className="text-sm text-text-secondary">Coût estimé de la période prévue</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-primary">{formatFcfa(prediction.costFcfa)}</dd>
          </div>
        )}
      </dl>
      <ProvenanceBadge value={prediction.provenance} />
    </div>
  )
}

export function PredictionNewView({ bundle, granularity, showModelDetails }: { bundle: PredictionsBundle; granularity: PredictionGranularity; showModelDetails: boolean }) {
  const consumptionGranularity = granularity === 'heure' ? 'hour' : 'day'
  const consumption = useQuery({
    queryKey: ['consumption-real', consumptionGranularity, ''],
    queryFn: () => rawConsumption(consumptionGranularity),
    enabled: granularity !== 'mois',
  })
  const [selected, setSelected] = useState<string | null>(null)
  const devices = bundle.perDevice
  const device = devices.find((d) => d.code === selected) ?? devices[0]

  return (
    <div className="flex flex-col gap-7">
      {!bundle.global && (
        <section className={SECTION} aria-label="Prévision de tout le compte">
          <h2 className="text-section-title font-semibold text-text-primary">Tout le compte</h2>
          <TimeChart
            labels={Array.from({ length: 24 }, (_, h) => `${h} h`)}
            series={[{ name: 'Prévu', values: Array.from({ length: 24 }, () => null), color: FORECAST, kind: 'dashed' }]}
            unit="kW"
            yAxisLabel="Puissance (kW)"
            xAxisLabel={X_LABEL[granularity]}
            height={320}
            emptyMessage="Aucune prévision pour l’instant : elle part des relevés de vos appareils. Dès qu’un appareil envoie un relevé, la courbe se dessine."
          />
        </section>
      )}

      {bundle.global && (
        <section className={SECTION} aria-label="Prévision de tout le compte">
          <h2 className="text-section-title font-semibold text-text-primary">Tout le compte</h2>
          <Figures prediction={bundle.global} />
          <MetricState status={granularity === 'mois' ? 'success' : consumption.status}>
            <ForecastChart prediction={bundle.global} granularity={granularity} consumption={consumption.data} />
          </MetricState>
          <p className="text-sm text-text-secondary">
            À gauche de « maintenant », ce que vos appareils ont consommé d’après leurs relevés ; à droite, ce qui est prévu. {bundle.global.intervalLabel}.
          </p>
        </section>
      )}

      {device && devices.length > 0 && (
        <section className={SECTION} aria-label="Prévision par appareil">
          <h2 className="text-section-title font-semibold text-text-primary">Appareil par appareil</h2>
          {devices.length > 1 && (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Appareil</legend>
              {devices.map((d) => (
                <button
                  key={d.code ?? d.title}
                  type="button"
                  aria-pressed={d === device}
                  onClick={() => setSelected(d.code ?? null)}
                  className={`focus-ring min-h-11 rounded-pill border px-4 text-sm font-semibold ${d === device ? 'border-text-primary bg-text-primary text-white' : 'border-border bg-card text-text-primary hover:bg-bg-elevated'}`}
                >
                  {d.title}
                </button>
              ))}
            </fieldset>
          )}
          <Figures prediction={device} />
          <MetricState status={granularity === 'mois' ? 'success' : consumption.status}>
            <ForecastChart prediction={device} granularity={granularity} consumption={consumption.data} code={device.code} />
          </MetricState>
          {showModelDetails && (
            <p className="text-sm text-text-secondary">
              Pour chaque appareil, la puissance attendue heure par heure. Un appareil dont la température, la vibration ou la pression dépasse vos seuils
              d’alerte est signalé dans Alertes ; la courbe se recale à chaque nouveau relevé.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
