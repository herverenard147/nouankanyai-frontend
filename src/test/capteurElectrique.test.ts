import { describe, expect, it } from 'vitest'

import { hasReading } from '@/api/rawBackend'
import type { BackendMachine } from '@/types/backend'

/**
 * Le capteur prévu mesure l'électricité (2026-10-15) : un appareil qui n'a qu'un relevé de puissance, sans
 * température ni vibration, est bien « mesuré » et entre dans les prévisions et les alertes.
 */
const base = { machine_id: 'TV-01', nom: 'Télévision', power_kw: 0.11, temperature_c: null, vibration_mm_s: null, pressure_bar: null }

describe('appareil suivi par un simple capteur électrique', () => {
  it('compte comme mesuré quand le serveur dit qu’il a un relevé', () => {
    expect(hasReading({ ...base, has_reading: true } as unknown as BackendMachine)).toBe(true)
  })
  it('ne compte pas sans aucun relevé', () => {
    expect(hasReading({ ...base, has_reading: false } as unknown as BackendMachine)).toBe(false)
  })
})
