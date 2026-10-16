import { modbusOffset } from '@/api/sources'
import type { BackendCustomMeterMap, BackendFileMapping } from '@/types/backend'

/**
 * Formulaires des sources de mesures (2026-10-16) : saisie -> corps envoyé au serveur. Fonctions pures, testées
 * (sourceForms.test.ts). Le serveur recontrôle tout et explique ce qui manque.
 */

// ----------------------------------------------------------------------------- compteur « autre » d'une passerelle

export const MEASURE_FIELDS: { key: keyof BackendCustomMeterMap['registers']; label: string; hint: string }[] = [
  { key: 'power_kw', label: 'Puissance (kW)', hint: 'W → kW : facteur 0,001' },
  { key: 'energy_kwh', label: 'Énergie cumulée (kWh)', hint: 'Wh → kWh : 0,001' },
  { key: 'voltage_v', label: 'Tension (V)', hint: 'dixièmes de volt : 0,1' },
  { key: 'current_a', label: 'Courant (A)', hint: 'milliampères : 0,001' },
  { key: 'power_factor', label: 'Facteur de puissance (0 à 1)', hint: 'en % : 0,01' },
]

export const DATA_TYPES: BackendCustomMeterMap['data_type'][] = ['float32', 'float32_swapped', 'int32', 'uint32', 'int16', 'uint16']

export type RegisterDraft = Record<string, { address: string; scale: string }>

/** Lecture d'un nombre saisi à la française (« 0,001 »). */
const num = (text: string) => Number(text.replace(',', '.').trim())

/**
 * Registres saisis -> table envoyée au serveur. Une adresse de notice (30053, 40001) est convertie en adresse comptée
 * depuis 0, et fixe la fonction Modbus (4 pour 3xxxx, 3 pour 4xxxx). Renvoie un message si quelque chose manque.
 */
export function buildCustomMap(fn: 3 | 4, dataType: BackendCustomMeterMap['data_type'], draft: RegisterDraft): BackendCustomMeterMap | string {
  const registers: BackendCustomMeterMap['registers'] = {}
  let functionCode: 3 | 4 = fn
  let documentedFn: 3 | 4 | null = null
  for (const field of MEASURE_FIELDS) {
    const entry = draft[field.key]
    if (!entry || entry.address.trim() === '') continue
    let address = num(entry.address)
    if (!Number.isInteger(address) || address < 0) return `${field.label} : adresse entière attendue.`
    const documented = modbusOffset(address)
    if (documented) {
      if (documentedFn !== null && documentedFn !== documented.function) return 'Les adresses mélangent des registres 3xxxx et 4xxxx : un compteur se lit avec une seule fonction.'
      documentedFn = documented.function
      address = documented.address
      functionCode = documented.function
    }
    if (address > 65535) return `${field.label} : adresse entre 0 et 65535.`
    const scale = entry.scale.trim() === '' ? 1 : num(entry.scale)
    if (!(scale > 0)) return `${field.label} : facteur positif attendu.`
    registers[field.key] = { address, scale, abs: field.key === 'power_factor' }
  }
  if (!registers.power_kw && !registers.energy_kwh) return 'Renseignez au moins la puissance ou l’énergie.'
  return { function: functionCode, data_type: dataType, registers }
}


// ----------------------------------------------------------------------------- réglage des colonnes d'un fichier

export type FileMeasure = 'power' | 'energy'

export interface FileDraft {
  date_column: string
  appliance: 'colonne' | 'unique'
  appliance_column: string
  machine_code: string
  utc_offset_hours: string
  measure: FileMeasure
  power_column: string
  power_unit: 'W' | 'kW' | 'MW'
  energy_column: string
  energy_unit: 'Wh' | 'kWh' | 'MWh'
  energy_kind: 'index' | 'intervalle'
  interval_minutes: string
  pf_column: string
  pf_percent: boolean
  voltage_column: string
  current_column: string
  temperature_column: string
}

export const EMPTY_FILE_DRAFT: FileDraft = {
  date_column: '', appliance: 'colonne', appliance_column: '', machine_code: '', utc_offset_hours: '0', measure: 'power',
  power_column: '', power_unit: 'kW', energy_column: '', energy_unit: 'kWh', energy_kind: 'index', interval_minutes: '15',
  pf_column: '', pf_percent: false, voltage_column: '', current_column: '', temperature_column: '',
}

export function fromMapping(m: BackendFileMapping): FileDraft {
  return {
    ...EMPTY_FILE_DRAFT,
    date_column: m.date_column,
    appliance: m.appliance_column ? 'colonne' : 'unique',
    appliance_column: m.appliance_column ?? '',
    machine_code: m.machine_code ?? '',
    utc_offset_hours: String(m.utc_offset_hours ?? 0),
    measure: m.power ? 'power' : 'energy',
    power_column: m.power?.column ?? '',
    power_unit: m.power?.unit ?? 'kW',
    energy_column: m.energy?.column ?? '',
    energy_unit: m.energy?.unit ?? 'kWh',
    energy_kind: m.energy?.kind ?? 'index',
    interval_minutes: String(m.energy?.interval_minutes ?? 15),
    pf_column: m.power_factor?.column ?? '',
    pf_percent: m.power_factor?.percent ?? false,
    voltage_column: m.voltage_column ?? '',
    current_column: m.current_column ?? '',
    temperature_column: m.temperature_column ?? '',
  }
}

/** Formulaire -> réglage envoyé au serveur (qui le contrôle aussi et explique ce qui manque). */
export function toMapping(d: FileDraft): BackendFileMapping {
  const orNull = (v: string) => (v.trim() ? v : null)
  return {
    date_column: d.date_column,
    appliance_column: d.appliance === 'colonne' ? orNull(d.appliance_column) : null,
    machine_code: d.appliance === 'unique' ? orNull(d.machine_code) : null,
    utc_offset_hours: Number(d.utc_offset_hours.replace(',', '.')) || 0,
    power: d.measure === 'power' && d.power_column ? { column: d.power_column, unit: d.power_unit } : null,
    energy:
      d.energy_column && (d.measure === 'energy' || d.energy_kind === 'index')
        ? { column: d.energy_column, unit: d.energy_unit, kind: d.energy_kind, ...(d.energy_kind === 'intervalle' ? { interval_minutes: Number(d.interval_minutes) } : {}) }
        : null,
    power_factor: d.pf_column ? { column: d.pf_column, percent: d.pf_percent } : null,
    voltage_column: orNull(d.voltage_column),
    current_column: orNull(d.current_column),
    temperature_column: orNull(d.temperature_column),
  }
}

