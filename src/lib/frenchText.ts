/**
 * Les textes de conseil viennent du backend avec des nombres à l'anglo-saxonne
 * ("75.0°C", "50.0Hz") alors que toute l'interface écrit à la française
 * ("255,0 kW"). On ne corrige que les nombres suivis d'une unité connue, pour
 * ne jamais altérer autre chose (identifiants, versions...).
 */
import { NARROW_NBSP } from '@/lib/formatters'

const NUMBER_WITH_UNIT = /(\d+)(?:\.(\d+))?\s?(°C|mm\/s|Hz|bar|kW|kWh|FCFA)/g
// Score du détecteur d'anomalie : "score: -0.1264" (nombre signé, sans unité).
const SCORE = /(score\s?:\s?)(-?)(\d+)\.(\d+)/gi

// Noms de mesure du backend (« vibration_mm_s ») : jamais montrés tels quels.
const MEASURE_NAMES: Record<string, string> = {
  temperature_c: 'température',
  vibration_mm_s: 'vibration',
  pressure_bar: 'pression',
  power_kw: 'puissance',
}
const MEASURE_NAME = /\b(temperature_c|vibration_mm_s|pressure_bar|power_kw)\b/g
// « depuis 0 relevés » ne dit rien : la précision n'est gardée qu'à partir d'un relevé.
const SINCE_ZERO = /,? depuis 0 relevés?/g

export function frenchNumbersWithUnits(text: string): string {
  return text
    .replace(MEASURE_NAME, (name: string) => MEASURE_NAMES[name] ?? name)
    .replace(SINCE_ZERO, '')
    .replace(SCORE, (_match, label: string, sign: string, integer: string, decimals: string) => `${label}${sign ? '−' : ''}${integer},${decimals}`)
    .replace(NUMBER_WITH_UNIT, (_match, integer: string, decimals: string | undefined, unit: string) =>
    `${integer}${decimals ? `,${decimals}` : ''}${NARROW_NBSP}${unit}`,
  )
}
