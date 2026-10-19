import { describe, expect, it } from 'vitest'

import { formatMonth } from '@/lib/formatters'

describe('Mois des factures et relevés affiché en clair', () => {
  it('« AAAA-MM » en clair, autre libellé tel quel', () => {
    expect(formatMonth('2026-08')).toBe('août 2026')
    expect(formatMonth('2022-05')).toBe('mai 2022')
    expect(formatMonth('2026-13')).toBe('2026-13')
    expect(formatMonth('Facture ancienne')).toBe('Facture ancienne')
    expect(formatMonth(null)).toBe('')
  })
})
