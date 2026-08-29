import { computeYTicks } from '@/lib/formatters'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { usePrediction } from '@/hooks/queries/usePrediction'
import type { Profile } from '@/types/domain'

interface PredictionPanelProps {
  profile: Profile
}

export function PredictionPanel({ profile }: PredictionPanelProps) {
  const query = usePrediction(profile)

  return (
    <Card className="flex flex-col gap-4 p-6" aria-label="Prédiction IA">
      <MetricState status={query.status}>
        {query.data && (
          <PredictionContent title={query.data.title} prediction={query.data} />
        )}
      </MetricState>
    </Card>
  )
}

function PredictionContent({
  title,
  prediction,
}: {
  title: string
  prediction: NonNullable<ReturnType<typeof usePrediction>['data']>
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
          <h3 className="text-section-title font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 font-mono text-prediction-value font-semibold tabular-nums text-text-primary">
            {prediction.value}
            <span className="ml-1 text-sm font-medium text-text-secondary">{prediction.unit}</span>
          </p>
          <p className="text-sm text-text-secondary">{prediction.intervalLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ProvenanceBadge value={prediction.provenance} />
          <p className="font-mono text-mono-axis text-text-tertiary">{prediction.modelName} · dataset: synthetic</p>
        </div>
      </div>

      <div className="hidden sm:block">
        <BarChart bars={bars} yTicks={yTicks} size="dashboard" yAxisLabel={prediction.yAxisUnit} xAxisLabel="jour" />
      </div>
      <div className="sm:hidden">
        <BarChart
          bars={bars}
          yTicks={yTicks}
          size="dashboardMobile"
          yAxisLabel={prediction.yAxisUnit}
          xAxisLabel="jour"
        />
      </div>

      <p className="text-sm text-text-secondary">{prediction.modelNote}</p>
    </>
  )
}
