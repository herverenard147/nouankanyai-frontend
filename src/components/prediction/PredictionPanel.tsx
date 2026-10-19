import { LineChart } from '@/components/charts/LineChart'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
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
            <p className="font-mono text-mono-axis text-text-tertiary">{prediction.modelName}</p>
          )}
        </div>
      </div>

      {/* Courbe plutôt que barres (demande du propriétaire, 2026-10-18) : les fluctuations se lisent mieux. */}
      <LineChart
        labels={prediction.series.map((p) => p.label)}
        series={[{ name: prediction.title, values: prediction.series.map((p) => p.value) }]}
        unit={prediction.yAxisUnit}
        xLabelEvery={Math.max(1, Math.ceil(prediction.series.length / 8))}
      />

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
