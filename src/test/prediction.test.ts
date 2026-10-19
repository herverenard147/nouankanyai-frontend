import { describe, expect, it } from 'vitest'

import { bucketize, firstForecastHour } from '@/api/prediction'

/** Correction 7 du test du site (2026-10-18) : vues placées sur le calendrier, vue Mois, plus de « 4 semaines ». */
function hourlyPoints(count: number, kwPerHour: number, costPerHour: number) {
  return Array.from({ length: count }, () => ({ predicted_kw: kwPerHour, cost_fcfa: costPerHour }))
}
const MIDNIGHT = new Date(Date.UTC(2026, 9, 20, 0, 0)) // mardi 20 octobre 2026, 0 h
const AFTERNOON = new Date(Date.UTC(2026, 9, 20, 15, 0))

describe('premier point prévu', () => {
  it('est l’heure pleine suivante', () => {
    expect(firstForecastHour(new Date(Date.UTC(2026, 9, 20, 14, 37))).toISOString()).toBe('2026-10-20T15:00:00.000Z')
  })
})

describe('vue Heure', () => {
  it('un point par heure, étiqueté à l’heure de l’horloge', () => {
    const { series, totalCostFcfa } = bucketize(hourlyPoints(24, 2, 100), 'heure', AFTERNOON)
    expect(series).toHaveLength(24)
    expect(series[0].label).toBe('15 h')
    expect(series[9].label).toBe('0 h')
    expect(totalCostFcfa).toBe(2400)
  })
})

describe('vue Jour', () => {
  it('des jours civils entiers depuis minuit', () => {
    const { series } = bucketize(hourlyPoints(24 * 7, 1, 10), 'jour', MIDNIGHT)
    expect(series).toHaveLength(7)
    series.forEach((p) => expect(p.value).toBe(24))
    expect(series[0].label).toMatch(/^mar\. 20 oct\.$/)
  })

  it('l’après-midi : le premier et le dernier jour sont partiels et le disent', () => {
    const { series } = bucketize(hourlyPoints(24 * 7, 1, 10), 'jour', AFTERNOON)
    expect(series).toHaveLength(8)
    expect(series[0].value).toBe(9) // 15 h à minuit
    expect(series[0].label).toContain('dès 15 h')
    expect(series[7].label).toContain('jusqu’à 15 h')
  })
})

describe('vue Mois', () => {
  it('prolonge la moyenne journalière : reste du mois puis deux mois entiers', () => {
    const { series } = bucketize(hourlyPoints(24 * 7, 1, 0), 'mois', MIDNIGHT)
    expect(series).toHaveLength(3)
    expect(series[0].label).toContain('reste du mois')
    expect(series[0].value).toBe(24 * 12) // 20 au 31 octobre
    expect(series[1].value).toBe(24 * 30) // novembre
    expect(series[2].value).toBe(24 * 31) // décembre
  })
})

describe('cas vide', () => {
  it('ne plante pas sur une liste de points vide', () => {
    for (const g of ['heure', 'jour', 'mois'] as const) {
      const { series, totalCostFcfa } = bucketize([], g, MIDNIGHT)
      expect(series).toEqual([])
      expect(totalCostFcfa).toBe(0)
    }
  })
})
