import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LANDING_CHARTS } from '@/data/landingCharts'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { Hero } from '@/pages/landing/sections/Hero'
import { PricingSection } from '@/pages/landing/sections/PricingSection'

describe('inscription des ménages', () => {
  afterEach(() => vi.unstubAllEnvs())
  it('ouverte : hero, formules et FAQ mènent à la création de compte (plus « d’ici 12 à 24 mois »)', () => {
    vi.stubEnv('VITE_EDITION', 'cnid') // ce texte décrit l'édition CNID (ménages ouverts)
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

describe('graphique du tarif moyen', () => {
  it('affiche la série annuelle officielle 71 → 83 FCFA/kWh HT et cite la Direction générale de l’Économie (décision du 2026-11-15)', () => {
    const tarif = LANDING_CHARTS.find((chart) => chart.id === 'tarif')
    expect(tarif?.headline).toBe('71 → 83')
    expect(tarif?.bars.map((bar) => [bar.x, bar.value])).toEqual([
      ['2023', 71],
      ['2024', 83],
    ])
    expect(tarif?.source).toMatch(/Direction générale de l’Économie/i)
  })
})
