import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendMachine } from '@/types/backend'

// La prévision d'une machine dépend de sa puissance nominale et de son historique, que le
// serveur ne lit que pour son propriétaire. Un appel sans jeton recevait une prévision
// générique : 4 kW affichés pour un four de 120 kW (constaté sur le staging le 2026-10-12).
vi.mock('@/lib/apiClient', () => ({
  api: { post: vi.fn().mockResolvedValue({ machine_id: 'M1', predictions: [] }), get: vi.fn() },
  saveBlob: vi.fn(),
}))

import { rawPredict } from '@/api/rawBackend'
import { api } from '@/lib/apiClient'

const machine = {
  machine_id: 'M1', nom: 'Four', power_kw: 120, temperature_c: 35, vibration_hz: 1.5, pressure_bar: 1,
} as BackendMachine

describe('rawPredict', () => {
  beforeEach(() => vi.mocked(api.post).mockClear())

  it('appelle /api/predict avec le jeton (jamais en anonyme)', async () => {
    await rawPredict(machine, 24)

    const [path, body, auth] = vi.mocked(api.post).mock.calls[0]
    expect(path).toBe('/api/predict')
    expect(body).toMatchObject({ machine_id: 'M1', hours_ahead: 24 })
    // Troisième argument absent ou vrai : apiClient envoie alors l'en-tête Authorization.
    expect(auth).not.toBe(false)
  })
})
