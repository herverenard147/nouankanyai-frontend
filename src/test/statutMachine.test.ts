import { describe, expect, it } from 'vitest'

import { statusLabel } from '@/api/backendHelpers'

describe('statusLabel : libellé du statut d’une machine', () => {
  it('traduit les trois statuts envoyés par le backend', () => {
    expect(statusLabel('actif')).toBe('Opérationnel')
    expect(statusLabel('alerte')).toBe('Anomalie détectée')
    // Une machine éteinte par le boîtier revient avec « arrete » : ne pas l'afficher brut (« Arrete »).
    expect(statusLabel('arrete')).toBe('Éteint')
  })

  it('garde un statut inconnu lisible plutôt que de le masquer', () => {
    expect(statusLabel('maintenance')).toBe('Maintenance')
  })
})
