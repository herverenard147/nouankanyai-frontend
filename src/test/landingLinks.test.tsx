import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LANDING_CHARTS } from '@/data/landingCharts'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { Hero } from '@/pages/landing/sections/Hero'
import { PricingSection } from '@/pages/landing/sections/PricingSection'

describe('liens « être informé à l’ouverture »', () => {
  it('renvoient vers le formulaire de contact (hero, formules, FAQ)', () => {
    render(
      <MemoryRouter>
        <Hero />
        <PricingSection />
        <FaqSection />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link', { name: /informé.*à l.ouverture/i })
    expect(links).toHaveLength(3)
    links.forEach((link) => expect(link).toHaveAttribute('href', '/#contact'))
  })
})

describe('graphique du tarif moyen', () => {
  it('cite une source officielle et les dates d’application du 79 et du 87', () => {
    const tarif = LANDING_CHARTS.find((chart) => chart.id === 'tarif')
    expect(tarif?.headline).toBe('79 → 87')
    expect(tarif?.bars.map((bar) => [bar.x, bar.value])).toEqual([
      ['juil. 2023', 79],
      ['janv. 2024', 87],
    ])
    expect(tarif?.source).toMatch(/gouvernement/i)
  })
})
