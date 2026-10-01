const numberFormatterInt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const numberFormatterOneDecimal = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

// Espace fine insécable (U+202F) avant l'unité (« 1.500 FCFA », « 75,0 °C ») : une espace pleine, ou une
// police mono, laissait un trou visible entre le nombre et son unité (retour du propriétaire, voir DESIGN.md
// règle 8). Séparateur de milliers : un point (retour du propriétaire, 2026-10-01 — Intl.NumberFormat('fr-FR')
// produit une espace par défaut, remplacée ci-dessous).
export const NARROW_NBSP = String.fromCodePoint(0x202f)
const NBSP = String.fromCodePoint(0x00a0)
const GROUP_SEPARATORS = new RegExp(`[${NBSP}${NARROW_NBSP} ]`, 'g')

/** Formate un nombre en notation française : point pour les milliers, virgule décimale. */
export function formatNumberFr(value: number, decimals: 0 | 1 = 0): string {
  const formatted = decimals === 0 ? numberFormatterInt.format(value) : numberFormatterOneDecimal.format(value)
  return formatted.replace(GROUP_SEPARATORS, '.')
}

export function formatFcfa(value: number): string {
  return `${formatNumberFr(value)}${NARROW_NBSP}FCFA`
}

export function formatKwh(value: number, decimals: 0 | 1 = 0): string {
  return `${formatNumberFr(value, decimals)}${NARROW_NBSP}kWh`
}

export function formatPercent(value: number, decimals: 0 | 1 = 0): string {
  return `${formatNumberFr(value, decimals)}${NARROW_NBSP}%`
}

/** Horodatage UTC du backend (ISO sans fuseau) → « 01/10/2026 01:12:09 », heure UTC. */
export function formatUtcDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`)
  if (Number.isNaN(date.getTime())) return '—'
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(date.getUTCDate())}/${two(date.getUTCMonth() + 1)}/${date.getUTCFullYear()} ${two(date.getUTCHours())}:${two(date.getUTCMinutes())}:${two(date.getUTCSeconds())}`
}

/**
 * Reproduit la logique de graduation Y de la maquette : back-solve la valeur
 * "100%" implicite à partir d'un point connu, puis renvoie [max, max/2, "0"].
 */
export function computeYTicks(maxValue: number, maxPercent: number): string[] {
  // maxPercent à 0 (aucune consommation sur la période, ex: compte neuf) :
  // la division par (0/100) donnerait NaN sur les 3 graduations affichées.
  const impliedMax = maxPercent === 0 ? 0 : maxValue / (maxPercent / 100)
  const fmt = (v: number) => (impliedMax < 10 ? formatNumberFr(v, 1) : formatNumberFr(v, 0))
  return [fmt(impliedMax), fmt(impliedMax / 2), '0']
}
