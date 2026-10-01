import { computeYTicks } from '@/lib/formatters'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import type { Prediction } from '@/types/domain'

export function PredictionContent({
  prediction,
  showModelDetails,
  showModelName = false,
}: {
  prediction: Prediction
  showModelDetails: boolean
  /** Admin uniquement : nom du modèle et jeu de données (il suit le comportement des modèles). Jamais côté client. */
  showModelName?: boolean
}) {
  const maxPoint = prediction.series.reduce((max, p) => (p.percent > max.percent ? p : max), prediction.series[0])
  const yTicks = maxPoint ? computeYTicks(maxPoint.value, maxPoint.percent) : ['0', '0', '0']

  const bars: ChartBar[] = prediction.series.map((point, i) => ({
    key: `pred-${i}`,
    x: point.label,
    percent: point.percent,
    tip: `${point.displayValue} ${prediction.unit}`,
  }))

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-section-title font-semibold text-text-primary">{prediction.title}</h3>
          <p className="mt-2 font-heading text-prediction-value font-semibold tabular-nums text-text-primary">
            {prediction.value}
            <span className="ml-1 text-sm font-medium text-text-secondary">{prediction.unit}</span>
          </p>
          <p className="text-sm text-text-secondary">{prediction.intervalLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ProvenanceBadge value={prediction.provenance} />
          {showModelName && (
            <p className="font-mono text-mono-axis text-text-tertiary">{prediction.modelName} · jeu de données : synthétique</p>
          )}
        </div>
      </div>

      <div className="hidden sm:block">
        <BarChart bars={bars} yTicks={yTicks} size="dashboard" yAxisLabel={prediction.yAxisUnit} xAxisLabel="période" />
      </div>
      <div className="sm:hidden">
        <BarChart
          bars={bars}
          yTicks={yTicks}
          size="dashboardMobile"
          yAxisLabel={prediction.yAxisUnit}
          xAxisLabel="période"
        />
      </div>

      {showModelDetails && (
        <p className="text-sm text-text-secondary">
          {showModelName
            ? prediction.modelNote
            : 'Pour chaque appareil, la puissance attendue heure par heure. Un appareil dont la température, la vibration ou la pression dépasse vos seuils d’alerte est signalé dans Alertes ; la courbe se recale à chaque nouveau relevé.'}
        </p>
      )}
    </>
  )
}
