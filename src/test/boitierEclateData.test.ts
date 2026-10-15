import { describe, expect, it } from 'vitest'

import { COMP, META, PARTS } from '@/components/boitier/boitierEclateData'

/** La vue éclatée du site lit ces trois tables ensemble : une pièce sans fiche ou sans boîte casserait le clic. */
describe('données de la vue éclatée du boîtier', () => {
  const keys = Object.keys(META.components)

  it('chaque sous-ensemble a sa fiche, ses pièces et leurs boîtes', () => {
    expect(keys).toHaveLength(8)
    keys.forEach((key) => {
      expect(COMP[key]).toBeDefined()
      expect(Object.keys(PARTS[key] ?? {}).length).toBeGreaterThan(0)
      Object.keys(PARTS[key] ?? {}).forEach((ref) => expect(META.parts[key]?.[ref]).toBeDefined())
    })
  })

  it('les segments d’animation tombent après l’éclatement (1 s) et dans l’animation (9 s)', () => {
    keys.forEach((key) => {
      const seg = META.components[key]!.segment
      if (!seg) return
      expect(seg[0]).toBeGreaterThan(1)
      expect(seg[1]).toBeLessThanOrEqual(9)
    })
  })
})
