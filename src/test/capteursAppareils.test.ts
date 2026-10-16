import { describe, expect, it } from 'vitest'

import { sensorsByMachine } from '@/api/sources'
import { measureOrigin } from '@/lib/formatters'
import type { BackendDevice } from '@/types/backend'

const device = (over: Partial<BackendDevice>): BackendDevice => ({ id: 'd', nom: 'x', kind: 'vocal', online: false, last_seen_at: null, ...over }) as BackendDevice

describe('capteurs des appareils', () => {
  it('dit « mesure du capteur » seulement quand la mesure vient vraiment du capteur', () => {
    expect(measureOrigin({ provenance: 'mesure' })).toBe('Nouvelle mesure du capteur')
    expect(measureOrigin({ provenance: 'simulation' })).toBe('Nouvelle mesure simulée (aucun capteur branché)')
    expect(measureOrigin({})).toBe('Nouvelle mesure simulée (aucun capteur branché)')
    expect(measureOrigin({ provenance: 'mesure' }, true)).toBe('dernière mesure du capteur')
  })

  it('retrouve le capteur de chaque appareil, et ignore les autres sources', () => {
    const map = sensorsByMachine([
      device({ id: 'c1', kind: 'capteur', machine_code: 'CLIM-1' }),
      device({ id: 'b1', kind: 'vocal' }),
      device({ id: 'p1', kind: 'passerelle' }),
      device({ id: 'c2', kind: 'capteur', machine_code: null }),
    ])
    expect([...map.keys()]).toEqual(['CLIM-1'])
    expect(map.get('CLIM-1')?.id).toBe('c1')
  })
})
