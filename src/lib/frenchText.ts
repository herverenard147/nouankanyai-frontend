/**
 * Les textes de conseil viennent du backend avec des nombres à l'anglo-saxonne
 * ("75.0°C", "50.0Hz") alors que toute l'interface écrit à la française
 * ("255,0 kW"). On ne corrige que les nombres suivis d'une unité connue, pour
 * ne jamais altérer autre chose (identifiants, versions...).
 */
const NUMBER_WITH_UNIT = /(\d+)(?:\.(\d+))?\s?(°C|Hz|bar|kW|kWh|FCFA)/g
// Score du détecteur d'anomalie : "score: -0.1264" (nombre signé, sans unité).
const SCORE = /(score\s?:\s?)(-?)(\d+)\.(\d+)/gi

export function frenchNumbersWithUnits(text: string): string {
  return text
    .replace(SCORE, (_match, label: string, sign: string, integer: string, decimals: string) => `${label}${sign ? '−' : ''}${integer},${decimals}`)
    .replace(NUMBER_WITH_UNIT, (_match, integer: string, decimals: string | undefined, unit: string) =>
    `${integer}${decimals ? `,${decimals}` : ''} ${unit}`,
  )
}
