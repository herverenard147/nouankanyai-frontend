import { describe, expect, it } from 'vitest'

import { bucketLabel, bucketize } from '@/api/prediction'

function hourlyPoints(count: number, kwPerHour: number, costPerHour: number) {
  return Array.from({ length: count }, () => ({ predicted_kw: kwPerHour, cost_fcfa: costPerHour }))
}

describe('bucketize — vue "heure"', () => {
  it('garde un point par heure sans agrégation', () => {
    const { series, totalCostFcfa } = bucketize(hourlyPoints(24, 2, 100), 'heure')
    expect(series).toHaveLength(24)
    expect(series[0].value).toBe(2)
    expect(totalCostFcfa).toBe(2400)
  })

  it('un pic isolé donne 100% et les autres barres un pourcentage relatif', () => {
    const points = [{ predicted_kw: 10, cost_fcfa: 0 }, { predicted_kw: 5, cost_fcfa: 0 }]
    const { series } = bucketize(points, 'heure')
    expect(series[0].percent).toBe(100)
    expect(series[1].percent).toBe(50)
  })
})

describe('bucketize — vue "jour"', () => {
  it('agrège 24 points horaires en un seul point journalier (somme = énergie kWh)', () => {
    const { series, totalCostFcfa } = bucketize(hourlyPoints(24, 2, 100), 'jour')
    expect(series).toHaveLength(1)
    expect(series[0].value).toBe(48) // 24h * 2kW = 48 kWh
    expect(totalCostFcfa).toBe(2400)
  })

  it('7 jours de 24h donnent 7 barres', () => {
    const { series } = bucketize(hourlyPoints(24 * 7, 1, 10), 'jour')
    expect(series).toHaveLength(7)
    series.forEach((point) => expect(point.value).toBe(24))
  })
})

describe('bucketize — vue "semaine"', () => {
  it('agrège 168 points horaires en un seul point hebdomadaire', () => {
    const { series } = bucketize(hourlyPoints(24 * 7, 3, 0), 'semaine')
    expect(series).toHaveLength(1)
    expect(series[0].value).toBe(24 * 7 * 3)
  })
})

describe('bucketize — cas vide', () => {
  it("ne plante pas sur une liste de points vide (division par max=0 protégée)", () => {
    const { series, totalCostFcfa } = bucketize([], 'heure')
    expect(series).toEqual([])
    expect(totalCostFcfa).toBe(0)
  })
})

describe('bucketLabel', () => {
  it('vue "heure" : +1 h, +2 h, ...', () => {
    expect(bucketLabel('heure', 0)).toBe('+1 h')
    expect(bucketLabel('heure', 4)).toBe('+5 h')
  })

  it('vue "semaine" : Sem. +1, Sem. +2, ...', () => {
    expect(bucketLabel('semaine', 0)).toBe('Sem. +1')
    expect(bucketLabel('semaine', 3)).toBe('Sem. +4')
  })

  it('vue "jour" : une date lisible, différente d\'un index à l\'autre', () => {
    const day0 = bucketLabel('jour', 0)
    const day1 = bucketLabel('jour', 1)
    expect(day0).not.toBe(day1)
    expect(day0.length).toBeGreaterThan(0)
  })
})
