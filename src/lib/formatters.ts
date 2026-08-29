const numberFormatterInt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
const numberFormatterOneDecimal = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

// Intl.NumberFormat('fr-FR') insère U+202F (narrow no-break space) entre les milliers ;
// on la normalise en espace normale (U+0020) pour un rendu prévisible dans toutes les polices.
const NARROW_NBSP = String.fromCodePoint(0x202f)
const NBSP = String.fromCodePoint(0x00a0)
const NON_BREAKING_SPACES = new RegExp(`[${NARROW_NBSP}${NBSP}]`, 'g')

/** Formate un nombre en notation française : espace pour les milliers, virgule décimale. */
export function formatNumberFr(value: number, decimals: 0 | 1 = 0): string {
  const formatted = decimals === 0 ? numberFormatterInt.format(value) : numberFormatterOneDecimal.format(value)
  return formatted.replace(NON_BREAKING_SPACES, ' ')
}

export function formatFcfa(value: number): string {
  return `${formatNumberFr(value)} FCFA`
}

export function formatKwh(value: number, decimals: 0 | 1 = 0): string {
  return `${formatNumberFr(value, decimals)} kWh`
}

export function formatPercent(value: number, decimals: 0 | 1 = 0): string {
  return `${formatNumberFr(value, decimals)} %`
}

/**
 * Reproduit la logique de graduation Y de la maquette : back-solve la valeur
 * "100%" implicite à partir d'un point connu, puis renvoie [max, max/2, "0"].
 */
export function computeYTicks(maxValue: number, maxPercent: number): string[] {
  const impliedMax = maxValue / (maxPercent / 100)
  const fmt = (v: number) => (impliedMax < 10 ? formatNumberFr(v, 1) : formatNumberFr(v, 0))
  return [fmt(impliedMax), fmt(impliedMax / 2), '0']
}
