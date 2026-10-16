const numberFormatterInt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const numberFormatterOneDecimal = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

// Espace fine insécable (U+202F) avant l'unité (« 1 500 FCFA », « 75,0 °C ») : une espace pleine, ou une
// police mono, laissait un trou visible entre le nombre et son unité (retour du propriétaire, voir DESIGN.md
// règle 8). Séparateur de milliers : la même espace fine. Le point essayé le 2026-10-01 a été retiré le
// 2026-10-12 (retour du propriétaire) : « 2.319 kWh » se lisait « 2,3 kWh ».
export const NARROW_NBSP = String.fromCodePoint(0x202f)
const NBSP = String.fromCodePoint(0x00a0)
const GROUP_SEPARATORS = new RegExp(`[${NBSP}${NARROW_NBSP} ]`, 'g')

/** Formate un nombre en notation française : espace fine pour les milliers, virgule décimale. */
export function formatNumberFr(value: number, decimals: 0 | 1 = 0): string {
  const formatted = decimals === 0 ? numberFormatterInt.format(value) : numberFormatterOneDecimal.format(value)
  return formatted.replace(GROUP_SEPARATORS, NARROW_NBSP)
}

export function formatFcfa(value: number): string {
  return `${formatNumberFr(value)}${NARROW_NBSP}FCFA`
}

/** Horodatage UTC du backend (ISO sans fuseau) → « 01/10/2026 01:12:09 », heure UTC. */
export function formatUtcDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const date = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`)
  if (Number.isNaN(date.getTime())) return '-'
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

/**
 * Relevé simulé par « Vérifier », avec seulement les mesures que l'appareil a (2026-10-15) : un appareil suivi par un
 * simple capteur électrique n'a ni température ni vibration. Ex. « 1,2 kW · 4,1 °C ».
 */
/** Origine de la mesure de vérification : le vrai capteur de l'appareil, ou une simulation faute de capteur. */
export function measureOrigin(r: { provenance?: 'simulation' | 'mesure' | null }, last = false): string {
  if (r.provenance === 'mesure') return last ? 'dernière mesure du capteur' : 'Nouvelle mesure du capteur'
  return last ? 'dernière mesure simulée' : 'Nouvelle mesure simulée (aucun capteur branché)'
}

export function measuredReading(r: { power_kw?: number | null; temperature_c?: number | null; vibration_mm_s?: number | null }): string {
  const parts: string[] = []
  if (r.power_kw !== null && r.power_kw !== undefined) {
    // deux décimales sous 10 kW (une télévision : 0,12 kW), une au-delà
    const kw = r.power_kw < 10 ? r.power_kw.toFixed(2).replace('.', ',') : formatNumberFr(r.power_kw, 1)
    parts.push(`${kw}${NARROW_NBSP}kW`)
  }
  if (r.temperature_c !== null && r.temperature_c !== undefined) parts.push(`${formatNumberFr(r.temperature_c, 1)}${NARROW_NBSP}°C`)
  if (r.vibration_mm_s !== null && r.vibration_mm_s !== undefined) parts.push(`${formatNumberFr(r.vibration_mm_s, 1)}${NARROW_NBSP}mm/s`)
  return parts.join(' · ')
}
