import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LANDING_CHARTS } from '@/data/landingCharts'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { Hero } from '@/pages/landing/sections/Hero'
import { PricingSection } from '@/pages/landing/sections/PricingSection'

describe('inscription des ménages', () => {
  it('ouverte : hero, formules et FAQ mènent à la création de compte (plus « d’ici 12 à 24 mois »)', () => {
    render(
      <MemoryRouter>
        <Hero />
        <PricingSection />
        <FaqSection />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link', { name: /Créer (mon|un) compte/i })
    expect(links).toHaveLength(3)
    links.forEach((link) => expect(link).toHaveAttribute('href', '/login?mode=signup&type=menage'))
    expect(screen.queryByText(/12 à 24/)).toBeNull()
  })
})

describe('graphique du prix du kWh', () => {
  // Décision D4 du 2026-11-10 : « 79 → 87 » (et ses dates) n'avait aucune source retrouvée ; il est remplacé par le
  // prix lu sur une vraie facture CIE basse tension. L'ancien test vérifiait le chiffre retiré.
  it('cite une facture CIE réelle et ses deux tranches, hors taxes', () => {
    const tarif = LANDING_CHARTS.find((chart) => chart.id === 'tarif')
    expect(tarif?.headline).toBe('94,94')
    expect(tarif?.bars.map((bar) => [bar.x, bar.value])).toEqual([
      ['Tranche 1', 94.94],
      ['Tranche 2', 80.74],
    ])
    expect(tarif?.source).toMatch(/facture CIE basse tension réelle/i)
  })
})
