import { rawMachines, rawPredict } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { Prediction, PredictionSeriesPoint, Profile } from '@/types/domain'

const HOURS_AHEAD = 7

/**
 * `/api/predict` (XGBoost) est par machine, pas par compte : on prédit pour la
 * machine qui pèse le plus dans la consommation (la plus significative à
 * surveiller). S'il n'y a aucune machine, l'appelant reçoit une erreur claire
 * plutôt qu'une prédiction inventée.
 */
export async function fetchPrediction(_profile: Profile): Promise<Prediction> {
  const machines = await rawMachines()
  if (machines.length === 0) {
    throw new Error('Aucun équipement enregistré : ajoutez un site et une machine pour obtenir une prédiction.')
  }
  const target = [...machines].sort((a, b) => b.power_kw - a.power_kw)[0]
  const { predictions } = await rawPredict(target, HOURS_AHEAD)

  const values = predictions.map((p) => p.predicted_kw)
  const max = Math.max(...values, 0.0001)
  const series: PredictionSeriesPoint[] = predictions.map((p) => ({
    label: `+${p.hour} h`,
    value: p.predicted_kw,
    displayValue: formatNumberFr(p.predicted_kw, 1),
    percent: Math.round((p.predicted_kw / max) * 100),
  }))

  const nextHour = predictions[0]
  const totalCost = predictions.reduce((sum, p) => sum + p.cost_fcfa, 0)

  return {
    title: `Prédiction de charge — ${target.nom}`,
    value: nextHour ? formatNumberFr(nextHour.predicted_kw, 1) : '—',
    unit: 'kW',
    intervalLabel: `coût estimé sur ${HOURS_AHEAD} h : ${formatNumberFr(totalCost)} FCFA`,
    modelNote:
      "Modèle XGBoost entraîné sur données synthétiques (voir Portail Admin). Aucun capteur physique installé : la prédiction s'appuie sur les derniers relevés enregistrés pour cette machine.",
    modelName: 'XGBoost',
    provenance: 'synthetique',
    yAxisUnit: 'kW',
    series,
  }
}
