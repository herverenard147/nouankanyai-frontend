import { Link } from 'react-router-dom'

import { BarChart, type ChartBar } from '@/components/charts/BarChart'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { usePredictionsBundle } from '@/hooks/queries/usePrediction'
import { computeYTicks } from '@/lib/formatters'
import type { Profile } from '@/types/domain'

interface PredictionSummaryProps {
  profile: Profile
  /** Admin, niveau technique : nom du modèle et jeu de données (il suit le comportement des modèles). */
  showModelName?: boolean
}

/**
 * Prédiction globale à l'heure, en aperçu : valeur, coût estimé, un graphique compact et le
 * raccourci vers la page Prédiction.
 */
export function PredictionSummary({ profile, showModelName = false }: PredictionSummaryProps) {
  const query = usePredictionsBundle(profile, 'heure')

  return (
    <section aria-label="Prédiction IA" className="flex min-w-0 flex-col gap-2">
      <MetricState status={query.status}>
        {query.data && <PredictionBody prediction={query.data.global} showModelName={showModelName} />}
      </MetricState>
    </section>
  )
}

function PredictionBody({
  prediction,
  showModelName,
}: {
  prediction: NonNullable<ReturnType<typeof usePredictionsBundle>['data']>['global']
  showModelName: boolean
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
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-text-primary">{prediction.title}</h2>
        <Link to="/app/prediction" className="focus-ring shrink-0 text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover">
          Voir la prédiction →
        </Link>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="font-heading text-[1.875rem] font-bold leading-tight tracking-[-0.02em] tabular-nums text-text-primary">
          {prediction.value}
          <span className="ml-1 text-sm font-medium tracking-normal text-text-secondary">{prediction.unit}</span>
        </p>
        <p className="text-[0.8125rem] text-text-secondary">{prediction.intervalLabel}</p>
        <ProvenanceBadge value={prediction.provenance} className="ml-auto" />
      </div>
      {showModelName && <p className="text-xs text-text-tertiary">{prediction.modelName} · jeu de données : synthétique</p>}
      <BarChart bars={bars} yTicks={yTicks} size="compact" xLabelEvery={6} />
    </>
  )
}
