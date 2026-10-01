import { rawMachines, rawPredict } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { Prediction, PredictionGranularity, PredictionsBundle, PredictionSeriesPoint, Profile } from '@/types/domain'

// Horizon interrogé côté backend (XGBoost, /api/predict) pour chaque granularité —
// pas besoin de changement backend : predict_next_hours() fait déjà varier
// heure-du-jour et jour-de-semaine sur tout l'horizon demandé, donc un horizon plus
// large donne de vraies variations (semaine vs week-end), pas une répétition à plat.
const HORIZON_HOURS: Record<PredictionGranularity, number> = {
  heure: 24,
  jour: 24 * 7,
  semaine: 24 * 7 * 4,
}
// Nombre d'heures agrégées par barre du graphique.
const BUCKET_HOURS: Record<PredictionGranularity, number> = {
  heure: 1,
  jour: 24,
  semaine: 24 * 7,
}
const GRANULARITY_INTERVAL_LABEL: Record<PredictionGranularity, string> = {
  heure: 'sur 24 h',
  jour: 'sur 7 jours',
  semaine: 'sur 4 semaines',
}

export function bucketLabel(granularity: PredictionGranularity, bucketIndex: number): string {
  if (granularity === 'heure') return `+${bucketIndex + 1} h`
  if (granularity === 'jour') {
    const date = new Date(Date.now() + bucketIndex * 24 * 3600 * 1000)
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  return `Sem. +${bucketIndex + 1}`
}

export function bucketize(
  points: { predicted_kw: number; cost_fcfa: number }[],
  granularity: PredictionGranularity,
): { series: PredictionSeriesPoint[]; totalCostFcfa: number } {
  const bucketSize = BUCKET_HOURS[granularity]
  const values: number[] = []
  const costs: number[] = []
  for (let i = 0; i < points.length; i += bucketSize) {
    const chunk = points.slice(i, i + bucketSize)
    // Vue "heure" : puissance instantanée (kW), on garde le point tel quel.
    // Vue "jour"/"semaine" : la somme des kW horaires d'un intervalle équivaut
    // numériquement à l'énergie consommée sur cet intervalle, en kWh.
    values.push(granularity === 'heure' ? chunk[0].predicted_kw : chunk.reduce((sum, p) => sum + p.predicted_kw, 0))
    costs.push(chunk.reduce((sum, p) => sum + p.cost_fcfa, 0))
  }
  const max = Math.max(...values, 0.0001)
  const series = values.map((value, i) => ({
    label: bucketLabel(granularity, i),
    value,
    displayValue: formatNumberFr(value, 1),
    percent: Math.round((value / max) * 100),
  }))
  return { series, totalCostFcfa: Math.round(costs.reduce((sum, c) => sum + c, 0)) }
}

function toPrediction(title: string, granularity: PredictionGranularity, bucketed: ReturnType<typeof bucketize>): Prediction {
  const unit = granularity === 'heure' ? 'kW' : 'kWh'
  const first = bucketed.series[0]
  return {
    title,
    value: first ? first.displayValue : '—',
    unit,
    intervalLabel: `coût estimé ${GRANULARITY_INTERVAL_LABEL[granularity]} : ${formatNumberFr(bucketed.totalCostFcfa)} FCFA`,
    modelNote:
      "Modèle XGBoost entraîné sur données synthétiques (voir Portail Admin). Aucun capteur physique installé : la prédiction s'appuie sur les derniers relevés enregistrés pour chaque équipement.",
    modelName: 'XGBoost',
    provenance: 'synthetique',
    yAxisUnit: unit,
    series: bucketed.series,
  }
}

/**
 * Prédiction par équipement ET globale (somme de tous les équipements), pour la
 * granularité demandée. `/api/predict` (XGBoost) est par machine, pas par compte :
 * on interroge chaque équipement séparément puis on agrège pour la vue globale.
 */
export async function fetchPredictionsBundle(_profile: Profile, granularity: PredictionGranularity): Promise<PredictionsBundle> {
  const machines = await rawMachines()
  // Aucun équipement enregistré (compte neuf, ou Admin qui n'a pas de site propre) : état vide, pas une
  // erreur réseau (DESIGN.md règle 1 — MetricState affiche « Aucune donnée pour le moment », jamais
  // « Indisponible » pour une absence de donnée légitime).
  if (machines.length === 0) {
    return { global: null, perDevice: [] }
  }

  const horizonHours = HORIZON_HOURS[granularity]
  const perMachine = await Promise.all(
    machines.map(async (machine) => ({
      machine,
      bucketed: bucketize((await rawPredict(machine, horizonHours)).predictions, granularity),
    })),
  )

  const perDevice: Prediction[] = perMachine.map(({ machine, bucketed }) => toPrediction(machine.nom, granularity, bucketed))

  // Somme point par point : même horizon pour tous les appareils, donc même nombre
  // de points prédits dans le même ordre — pas besoin de réaligner par date.
  const bucketCount = perMachine[0]?.bucketed.series.length ?? 0
  const globalValues = Array.from({ length: bucketCount }, (_, i) =>
    perMachine.reduce((sum, d) => sum + (d.bucketed.series[i]?.value ?? 0), 0),
  )
  const globalCostFcfa = perMachine.reduce((sum, d) => sum + d.bucketed.totalCostFcfa, 0)
  const max = Math.max(...globalValues, 0.0001)
  const globalSeries: PredictionSeriesPoint[] = globalValues.map((value, i) => ({
    label: bucketLabel(granularity, i),
    value,
    displayValue: formatNumberFr(value, 1),
    percent: Math.round((value / max) * 100),
  }))
  const global = toPrediction('Prédiction globale — tous les équipements', granularity, {
    series: globalSeries,
    totalCostFcfa: globalCostFcfa,
  })

  return { global, perDevice }
}
