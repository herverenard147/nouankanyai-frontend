/**
 * Ligne de temps des nouvelles vues de Prédiction (2026-10-20) : le mesuré (relevés) puis le prévu, sur un pas
 * régulier, avec les jours nommés (Hier, Aujourd’hui, Demain) et le changement de jour marqué. Heure d'Abidjan =
 * temps universel, comme le reste du site.
 */
export const HOUR_MS = 3600 * 1000
export const DAY_MS = 24 * HOUR_MS

export interface TimePoint {
  /** Début du pas, en millisecondes. */
  at: number
  value: number | null
}

export interface Timeline {
  at: number[]
  past: (number | null)[]
  future: (number | null)[]
  /** Indice du premier point prévu ; absent sans prévision. */
  nowIndex?: number
}

/** Mesuré puis prévu sur un pas régulier ; un pas sans valeur reste vide. Le mesuré n'empiète jamais sur le prévu. */
export function mergeTimeline(past: TimePoint[], future: TimePoint[], stepMs: number, fromMs?: number): Timeline {
  const firstFuture = future.length ? Math.min(...future.map((p) => p.at)) : Infinity
  const keptPast = past.filter((p) => p.at < firstFuture && (fromMs === undefined || p.at >= fromMs))
  const all = [...keptPast, ...future]
  if (all.length === 0) return { at: [], past: [], future: [] }
  const start = Math.min(...all.map((p) => p.at))
  const end = Math.max(...all.map((p) => p.at))
  const count = Math.round((end - start) / stepMs) + 1
  const at = Array.from({ length: count }, (_, i) => start + i * stepMs)
  const index = (t: number) => Math.round((t - start) / stepMs)
  const pastValues: (number | null)[] = new Array(count).fill(null)
  const futureValues: (number | null)[] = new Array(count).fill(null)
  keptPast.forEach((p) => (pastValues[index(p.at)] = p.value))
  future.forEach((p) => (futureValues[index(p.at)] = p.value))
  return { at, past: pastValues, future: futureValues, nowIndex: future.length ? index(firstFuture) : undefined }
}

const utcDay = (ms: number) => Math.floor(ms / DAY_MS)

export function dayName(ms: number, now: number = Date.now()): string {
  const diff = utcDay(ms) - utcDay(now)
  if (diff === -1) return 'Hier'
  if (diff === 0) return 'Aujourd’hui'
  if (diff === 1) return 'Demain'
  return shortDate(ms)
}

export function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** Pas horaires : un nom par jour au-dessus, un trait à chaque minuit, l'heure toutes les 6 h, la date à minuit. */
export function hourlyDecor(at: number[], now: number = Date.now()) {
  const zones: { from: number; to: number; label: string }[] = []
  const separators: number[] = []
  at.forEach((t, i) => {
    const last = zones[zones.length - 1]
    if (!last || utcDay(at[last.from]) !== utcDay(t)) {
      if (last) separators.push(i)
      zones.push({ from: i, to: i, label: dayName(t, now) })
    } else last.to = i
  })
  const ticks = at.map((t) => {
    const h = new Date(t).getUTCHours()
    if (h === 0) return shortDate(t)
    return h % 6 === 0 ? `${h} h` : null
  })
  const labels = at.map((t) => `${dayName(t, now)}, ${shortDate(t)}, ${new Date(t).getUTCHours()} h`)
  return { zones, separators, ticks, labels }
}

/**
 * Valeur horaire mesurée en kW. Le pas en cours n'est pas fini : ses kWh couvrent seulement les minutes déjà
 * passées. On les ramène à la puissance moyenne de ces minutes (moins d'un quart d'heure : trop peu, rien).
 */
export function hourlyPowerKw(startMs: number, kwh: number | null, now: number = Date.now()): number | null {
  if (kwh === null) return null
  const elapsed = Math.min(HOUR_MS, now - startMs)
  if (elapsed < HOUR_MS / 4) return null
  return kwh / (elapsed / HOUR_MS)
}
