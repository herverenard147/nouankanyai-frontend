import { computeYTicks } from '@/lib/formatters'
import { levelAtLeast } from '@/lib/levelGating'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { usePredictionsBundle } from '@/hooks/queries/usePrediction'
import type { Level, Prediction, Profile } from '@/types/domain'

interface PredictionPanelProps {
  profile: Profile
  level: Level
}

/** Aperçu compact utilisé sur les pages Vue d'ensemble : uniquement la prédiction
 * globale (tous équipements), à l'heure — le détail par équipement et les autres
 * granularités vivent sur la page dédiée /app/prediction. */
export function PredictionPanel({ profile, level }: PredictionPanelProps) {
  const query = usePredictionsBundle(profile, 'heure')

  return (
    <Card className="flex flex-col gap-4 p-6" aria-label="Prédiction IA">
      <MetricState status={query.status}>
        {query.data && (
          <PredictionContent prediction={query.data.global} showModelDetails={levelAtLeast(level, 'technique')} />
        )}
      </MetricState>
    </Card>
  )
}

export function PredictionContent({
  prediction,
  showModelDetails,
}: {
  prediction: Prediction
  showModelDetails: boolean
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
          Pour chaque appareil, la puissance attendue heure par heure. Un appareil dont la température, la vibration ou la pression
          dépasse vos seuils d’alerte est signalé dans Alertes ; la courbe se recale à chaque nouveau relevé.
        </p>
      )}
    </>
  )
}
