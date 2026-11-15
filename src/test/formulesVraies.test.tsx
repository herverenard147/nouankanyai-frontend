import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PricingSection } from '@/pages/landing/sections/PricingSection'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { ProfilesSection } from '@/pages/landing/sections/ProfilesSection'
import { STEPS_BY_PROFILE } from '@/lib/gettingStarted'

function text(ui: React.ReactElement) {
  const { container } = render(<MemoryRouter>{ui}</MemoryRouter>)
  return container.textContent ?? ''
}

describe('la communication dit ce que chaque formule inclut', () => {
  it('la carte Découverte ne promet plus les conseils comme acquis', () => {
    const t = text(<PricingSection />)
    expect(t).not.toContain('Conseils classés par impact')
    expect(t).not.toContain('gratuit pendant la phase pilote')
    expect(t).toContain('Optimum')
  })
  it('les cartes PME et Industrie citent l’abonnement et la part de 40 %', () => {
    const t = text(<PricingSection />)
    expect(t.match(/50 000 FCFA par mois/g)?.length).toBe(2)
    expect(t.match(/40 % des économies/g)?.length).toBe(2)
  })
  it('la FAQ ne dit plus « les ménages ensuite »', () => {
    expect(text(<FaqSection />)).not.toContain('ménages ensuite')
  })
  it('le rapport ménage est mensuel, jamais hebdomadaire', () => {
    const t = text(<ProfilesSection />)
    expect(t).not.toContain('chaque semaine')
    expect(t).not.toContain('Bientôt disponible')
  })
  it('les Premiers pas ménage disent quelle formule ouvre prévision et conseils', () => {
    const steps = STEPS_BY_PROFILE.menage
    expect(steps.find((s) => s.id === 'prediction')?.what).toContain('Essentiel')
    expect(steps.find((s) => s.id === 'conseils')?.what).toContain('Optimum')
  })
})
