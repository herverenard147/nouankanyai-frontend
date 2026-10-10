import { describe, expect, it } from 'vitest'

import { computeYTicks, formatFcfa, formatNumberFr } from '@/lib/formatters'

describe('formatNumberFr', () => {
  it('formats thousands with a dot separator', () => {
    expect(formatNumberFr(1240)).toBe('1.240')
  })

  it('formats one decimal with a comma', () => {
    expect(formatNumberFr(2.1, 1)).toBe('2,1')
  })
})

describe('formatFcfa', () => {
  it('appends the unit after a narrow no-break space', () => {
    expect(formatFcfa(18800)).toBe('18.800\u202fFCFA')
  })
})

describe('computeYTicks', () => {
  it('back-solves the implied 100% value and returns [max, max/2, 0]', () => {
    expect(computeYTicks(7.4, 100)).toEqual(['7,4', '3,7', '0'])
  })

  it('formats as integers once the implied max reaches double digits', () => {
    expect(computeYTicks(226, 100)).toEqual(['226', '113', '0'])
  })
})
