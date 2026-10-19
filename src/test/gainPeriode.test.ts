import { describe, expect, it } from 'vitest'

import { formatGain } from '@/lib/formatters'

describe('Gain affiché avec sa période', () => {
  it('par mois, par jour, par intervention, et sans période sur une ancienne réponse', () => {
    expect(formatGain(1200, 'mois')).toMatch(/^−1.200.FCFA par mois$/)
    expect(formatGain(300, 'jour')).toContain('par jour')
    expect(formatGain(40, 'action')).toContain('par intervention')
    expect(formatGain(40)).not.toContain('par')
  })
})
