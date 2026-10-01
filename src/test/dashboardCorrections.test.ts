import { describe, expect, it } from 'vitest'

import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { impactClassName } from '@/lib/severity'

describe('frenchNumbersWithUnits', () => {
  it('passe les décimales à la virgule et sépare l’unité', () => {
    expect(frenchNumbersWithUnits('La température est de 75.0°C (seuil critique: 60.0°C)')).toBe(
      'La température est de 75,0\u202f°C (seuil critique: 60,0\u202f°C)',
    )
    expect(frenchNumbersWithUnits('vibration de 50.0Hz, seuil 45.0Hz')).toBe('vibration de 50,0\u202fHz, seuil 45,0\u202fHz')
  })

  it('met aussi le score du détecteur d’anomalie à la française', () => {
    expect(frenchNumbersWithUnits('comportement anormal (score: -0.1264). Température: 47.0°C')).toBe(
      'comportement anormal (score: −0,1264). Température: 47,0\u202f°C',
    )
  })

  it('ne touche ni aux nombres sans unité ni aux identifiants', () => {
    expect(frenchNumbersWithUnits('NEW-F2558C version 1.2 machine 3')).toBe('NEW-F2558C version 1.2 machine 3')
  })
})

describe('impactClassName', () => {
  it('vert pour un gain chiffré, jamais pour une sévérité', () => {
    expect(impactClassName('gain', '−12 000 FCFA')).toBe('text-confirm')
    expect(impactClassName('severity', 'critique')).toBe('text-alert')
    expect(impactClassName('severity', 'moyenne')).toBe('text-text-secondary')
  })
})

describe('navigation PME/Industrie', () => {
  it('distingue les factures d’électricité de la commission Nouankany', () => {
    for (const profile of ['pme', 'industrie'] as const) {
      const labels = NAV_BY_PROFILE[profile].map((entry) => entry.label)
      expect(labels).toContain('Factures CIE')
      expect(labels).toContain('Commission')
      expect(labels).not.toContain('Facturation')
    }
  })
})
