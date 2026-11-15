import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PricingSection } from '@/pages/landing/sections/PricingSection'
import { CguPage } from '@/pages/legal/CguPage'

// S-09/S-19 (texte) : pas de promesse de commande ni de prix qui laisse croire que le paiement est ouvert.
describe('Textes publics : boîtier prototype, paiement non ouvert', () => {
  it('la tarification dit « gratuit pendant la phase pilote, paiement non ouvert »', () => {
    render(<MemoryRouter><PricingSection /></MemoryRouter>)
    expect(screen.getByText(/2 900 FCFA\/mois\) et Optimum \(7 900 FCFA\/mois\) : gratuit pendant la phase pilote, paiement non ouvert/)).toBeTruthy()
  })

  it('les CGU ne disent plus que le boîtier se commande depuis la plateforme', () => {
    const { container } = render(<MemoryRouter><CguPage /></MemoryRouter>)
    expect(container.textContent).not.toContain('se commandent depuis la plateforme')
    expect(container.textContent).toContain('prototype, non commercialisé')
  })
})
