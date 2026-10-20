import { Link } from 'react-router-dom'

import { TimeChart } from '@/components/charts/TimeChart'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { usePredictionsBundle } from '@/hooks/queries/usePrediction'
import { hourlyDecor } from '@/lib/timeline'
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
      {!query.data?.global && <h2 className="text-base font-bold text-text-primary">Prédiction</h2>}
      <MetricState status={query.status} isEmpty={!query.data?.global}>
        {query.data?.global && <PredictionBody prediction={query.data.global} showModelName={showModelName} />}
      </MetricState>
    </section>
  )
}

function PredictionBody({
  prediction,
  showModelName,
}: {
  prediction: NonNullable<NonNullable<ReturnType<typeof usePredictionsBundle>['data']>['global']>
  showModelName: boolean
}) {
  // Même graphique que les pages Conso et Prédiction (2026-10-20) : axes nommés, jours nommés, minuit marqué.
  const decor = prediction.starts?.length === prediction.series.length ? hourlyDecor(prediction.starts) : null

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
      <TimeChart
        labels={decor?.labels ?? prediction.series.map((p) => p.label)}
        ticks={decor?.ticks}
        zones={decor?.zones}
        separators={decor?.separators}
        series={[{ name: 'Prévu', values: prediction.series.map((p) => p.value), color: '#2b6cb0', kind: 'area' }]}
        unit={prediction.unit}
        yAxisLabel={prediction.unit === 'kW' ? 'Puissance prévue (kW)' : `Énergie prévue (${prediction.unit})`}
        xAxisLabel="Heure, 24 prochaines heures"
        height={200}
        showLegend={false}
      />
    </>
  )
}
