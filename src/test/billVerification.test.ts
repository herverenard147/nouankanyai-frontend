import { describe, expect, it } from 'vitest'

import { verificationChecks } from '@/lib/billVerification'

describe('contrôle du justificatif affiché à l’administrateur', () => {
  it('signale ce qui reste à vérifier', () => {
    const c = verificationChecks({ document: 'facture_cie', numero: 'a_verifier', numero_lu: '157923236', chiffres: 'non_lu' })
    expect(c.map((x) => x.ok)).toEqual([true, false, false])
    expect(c[1].label).toContain('157923236')
  })
  it('tout est conforme', () => {
    const c = verificationChecks({ document: 'facture_cie', numero: 'ok', numero_lu: '032410402000', chiffres: 'ok' })
    expect(c.every((x) => x.ok)).toBe(true)
  })
})
