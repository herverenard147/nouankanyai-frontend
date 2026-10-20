import { getCachedMachines, hasReading, rawPredict } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { Prediction, PredictionGranularity, PredictionsBundle, PredictionSeriesPoint, Profile } from '@/types/domain'

/*
 * Correction 7 du test du site (2026-10-18) : la vue « Jour » découpait des tranches de 24 h à partir de
 * maintenant et les étiquetait comme des jours civils (décalage d'un jour) ; la vue « Semaine » annonçait
 * « sur 4 semaines » pour 7 jours. Les points sont maintenant placés sur le calendrier : le premier point est
 * l'heure pleine suivante (comme ml/prediction.py), en temps universel (heure d'Abidjan). Le modèle prévoit au
 * plus 7 jours : la vue « Mois » prolonge leur moyenne, et le dit.
 */
const HORIZON_HOURS: Record<PredictionGranularity, number> = { heure: 24, jour: 24 * 7, mois: 24 * 7 }
const GRANULARITY_INTERVAL_LABEL: Record<PredictionGranularity, string> = {
  heure: 'sur 24 h',
  jour: 'sur les jours entiers prévus',
  mois: 'sur 3 mois, en prolongeant la moyenne des 7 jours prévus',
}
const MONTHS_AHEAD = 3
const HOUR_MS = 3600 * 1000

type Point = { predicted_kw: number; cost_fcfa: number }

/** Heure pleine qui suit `now` : l'heure du premier point prévu. */
export function firstForecastHour(now: Date = new Date()): Date {
  const d = new Date(now)
  d.setUTCMinutes(0, 0, 0)
  return new Date(d.getTime() + HOUR_MS)
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function bucketize(
  points: Point[],
  granularity: PredictionGranularity,
  start: Date = firstForecastHour(),
): { series: PredictionSeriesPoint[]; totalCostFcfa: number; starts: number[] } {
  const labels: string[] = []
  // Début de chaque point (ms) : la nouvelle vue les place sur la même ligne de temps que le mesuré.
  const starts: number[] = []
  const values: number[] = []
  const costs: number[] = []

  if (granularity === 'heure') {
    points.forEach((p, i) => {
      labels.push(`${new Date(start.getTime() + i * HOUR_MS).getUTCHours()} h`)
      starts.push(start.getTime() + i * HOUR_MS)
      values.push(p.predicted_kw)
      costs.push(p.cost_fcfa)
    })
  } else if (granularity === 'jour') {
    // Jours civils ; le premier (et le dernier) peuvent être partiels : l'étiquette le dit.
    const byDay = new Map<string, { date: Date; kwh: number; cost: number; hours: number; first: number; last: number }>()
    points.forEach((p, i) => {
      const t = new Date(start.getTime() + i * HOUR_MS)
      const key = t.toISOString().slice(0, 10)
      const day = byDay.get(key) ?? { date: t, kwh: 0, cost: 0, hours: 0, first: t.getUTCHours(), last: t.getUTCHours() }
      day.kwh += p.predicted_kw // 1 h à x kW = x kWh
      day.cost += p.cost_fcfa
      day.hours += 1
      day.last = t.getUTCHours()
      byDay.set(key, day)
    })
    // Seulement les jours entiers : un jour entamé faisait un creux trompeur au début et à la fin de la courbe.
    for (const [key, day] of byDay.entries()) {
      if (day.hours < 24) continue
      starts.push(Date.parse(`${key}T00:00:00Z`))
      labels.push(dayLabel(day.date))
      values.push(day.kwh)
      costs.push(day.cost)
    }
  } else {
    // Mois : moyenne journalière des jours prévus × jours restants du mois en cours, puis mois entiers.
    const days = points.length / 24
    const dailyKwh = days > 0 ? points.reduce((sum, p) => sum + p.predicted_kw, 0) / days : 0
    const dailyCost = days > 0 ? points.reduce((sum, p) => sum + p.cost_fcfa, 0) / days : 0
    for (let k = 0; k < MONTHS_AHEAD && points.length > 0; k += 1) {
      const year = start.getUTCFullYear() + Math.floor((start.getUTCMonth() + k) / 12)
      const month = (start.getUTCMonth() + k) % 12
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
      const count = k === 0 ? daysInMonth - start.getUTCDate() + 1 : daysInMonth
      // Court : « (reste du mois) » chevauchait le mois suivant sur téléphone.
      labels.push(k === 0 ? `fin ${monthLabel(year, month)}` : monthLabel(year, month))
      starts.push(k === 0 ? start.getTime() : Date.UTC(year, month, 1))
      values.push(dailyKwh * count)
      costs.push(dailyCost * count)
    }
  }

  const max = Math.max(...values, 0.0001)
  const series = values.map((value, i) => ({
    label: labels[i],
    value,
    displayValue: formatNumberFr(value, 1),
    percent: Math.round((value / max) * 100),
  }))
  return { series, totalCostFcfa: Math.round(costs.reduce((sum, c) => sum + c, 0)), starts }
}

function toPrediction(title: string, granularity: PredictionGranularity, bucketed: ReturnType<typeof bucketize>, code?: string): Prediction {
  const unit = granularity === 'heure' ? 'kW' : 'kWh'
  // Heure : la puissance de l'heure qui vient ; Jour et Mois : le total de la période (avant : le premier jour,
  // souvent entamé, en gros chiffre).
  const first = bucketed.series[0]
  const total = bucketed.series.reduce((sum, p) => sum + p.value, 0)
  return {
    title,
    value: granularity === 'heure' ? (first ? first.displayValue : '-') : bucketed.series.length ? formatNumberFr(total, total < 100 ? 1 : 0) : '-',
    unit,
    intervalLabel: `coût estimé ${GRANULARITY_INTERVAL_LABEL[granularity]} : ${formatNumberFr(bucketed.totalCostFcfa)} FCFA`,
    modelNote:
      granularity === 'mois'
        ? 'Prévision heure par heure sur 7 jours, à partir des relevés de chaque appareil ; chaque mois prolonge leur moyenne journalière.'
        : 'Prévision heure par heure, à partir des relevés de chaque appareil ; elle se recale à chaque nouveau relevé.',
    modelName: 'Prévision par appareil',
    provenance: 'estime',
    yAxisUnit: unit,
    series: bucketed.series,
    starts: bucketed.starts,
    costFcfa: bucketed.totalCostFcfa,
    code,
  }
}

/**
 * Prédiction par équipement ET globale (somme de tous les équipements), pour la
 * granularité demandée. `/api/predict` (XGBoost) est par machine, pas par compte :
 * on interroge chaque équipement séparément puis on agrège pour la vue globale.
 */
export async function fetchPredictionsBundle(_profile: Profile, granularity: PredictionGranularity): Promise<PredictionsBundle> {
  const machines = await getCachedMachines()
  // Aucun équipement enregistré (compte neuf, ou Admin qui n'a pas de site propre) : état vide, pas une
  // erreur réseau (DESIGN.md règle 1 : MetricState affiche « Aucune donnée pour le moment », jamais
  // « Indisponible » pour une absence de donnée légitime).
  if (machines.length === 0) {
    return { global: null, perDevice: [] }
  }

  // Une prévision part d'un relevé réel : les machines sans relevé sont laissées de côté.
  const measured = machines.filter(hasReading)
  if (measured.length === 0) {
    return { global: null, perDevice: [] }
  }

  const horizonHours = HORIZON_HOURS[granularity]
  const start = firstForecastHour()
  const perMachine = await Promise.all(
    measured.map(async (machine) => ({
      machine,
      bucketed: bucketize((await rawPredict(machine, horizonHours)).predictions, granularity, start),
    })),
  )

  const perDevice: Prediction[] = perMachine.map(({ machine, bucketed }) => toPrediction(machine.nom, granularity, bucketed, machine.machine_id))

  // Somme point par point : même horizon pour tous les appareils, donc même nombre
  // de points prédits dans le même ordre : pas besoin de réaligner par date.
  const bucketCount = perMachine[0]?.bucketed.series.length ?? 0
  const globalValues = Array.from({ length: bucketCount }, (_, i) =>
    perMachine.reduce((sum, d) => sum + (d.bucketed.series[i]?.value ?? 0), 0),
  )
  const globalCostFcfa = perMachine.reduce((sum, d) => sum + d.bucketed.totalCostFcfa, 0)
  const max = Math.max(...globalValues, 0.0001)
  const globalSeries: PredictionSeriesPoint[] = globalValues.map((value, i) => ({
    label: perMachine[0]?.bucketed.series[i]?.label ?? '',
    value,
    displayValue: formatNumberFr(value, 1),
    percent: Math.round((value / max) * 100),
  }))
  const global = toPrediction('Prédiction globale : tous les équipements', granularity, {
    series: globalSeries,
    totalCostFcfa: globalCostFcfa,
    starts: perMachine[0]?.bucketed.starts ?? [],
  })

  return { global, perDevice }
}
