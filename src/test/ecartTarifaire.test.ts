import { describe, expect, it } from 'vitest'

import { LANDING_CHARTS } from '@/data/landingCharts'

// S-03 : l'écart creuses/pointe vient de la grille moyenne tension de ml/tariffs.py
// (ANARE-CI, arrêté du 2 janvier 2019) : 57,17 / 69,09 / 94,21 FCFA/kWh.
describe("Accueil : écart tarifaire creuses/pointe", () => {
  const chart = LANDING_CHARTS.find((c) => c.id === 'ecart')!

  it('affiche ×1,65 (94,21 / 57,17), pas ×2', () => {
    expect(94.21 / 57.17).toBeCloseTo(1.648, 3)
    expect(chart.headline).toBe('×1,65')
  })

  it('les barres suivent la grille, indice 1 = heures creuses', () => {
    const valeurs = chart.bars.map((b) => b.value)
    expect(valeurs[0]).toBe(1)
    expect(valeurs[1]).toBeCloseTo(69.09 / 57.17, 1)
    expect(valeurs[2]).toBeCloseTo(94.21 / 57.17, 1)
  })

  it('cite la grille', () => {
    expect(chart.source).toContain('ANARE-CI')
  })
})
