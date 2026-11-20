import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/pages/auth/LoginPage'
import { PricingSection } from '@/pages/landing/sections/PricingSection'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { Hero } from '@/pages/landing/sections/Hero'
import { ProfilesSection } from '@/pages/landing/sections/ProfilesSection'

/** Deux plateformes (`VITE_EDITION`) : le ménage n'existe qu'en édition CNID ; la plateforme Nouankany (ESATIC) est PME et Industrie. */
afterEach(() => vi.unstubAllEnvs())

const signup = () =>
  render(
    <MemoryRouter initialEntries={['/login?mode=signup']}>
      <LoginPage />
    </MemoryRouter>,
  )

describe('édition Nouankany (par défaut) : pas de ménage', () => {
  it('le formulaire d’inscription ne propose que PME et Industrie, PME préselectionné', () => {
    signup()
    expect(screen.queryByRole('button', { name: 'Ménage' })).toBeNull()
    expect(screen.getByRole('button', { name: 'PME' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Industrie' })).toBeTruthy()
  })

  it('un lien ?type=menage ne préselectionne pas le ménage', () => {
    render(
      <MemoryRouter initialEntries={['/login?mode=signup&type=menage']}>
        <LoginPage />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: 'Ménage' })).toBeNull()
  })

  it('la page d’accueil ne présente ni la formule Découverte ni l’inscription des ménages', () => {
    render(
      <MemoryRouter>
        <Hero />
        <PricingSection />
      </MemoryRouter>,
    )
    expect(screen.queryByText('Découverte')).toBeNull()
    expect(screen.queryByText(/Ménages\s*:/)).toBeNull()
  })
})

describe('édition Nouankany : plus aucune mention de l’inscription des ménages sur l’accueil', () => {
  it('la section des profils ne montre que PME et Industrie', () => {
    const { container } = render(
      <MemoryRouter>
        <ProfilesSection />
      </MemoryRouter>,
    )
    expect(container.textContent).not.toMatch(/Ménage/)
    expect(container.textContent).toMatch(/PME et Industrie en pilote\./)
  })

  it('la FAQ ne dit pas que les ménages peuvent s’inscrire', () => {
    const { container } = render(
      <MemoryRouter>
        <FaqSection />
      </MemoryRouter>,
    )
    expect(container.textContent).not.toMatch(/inscription des ménages/i)
    expect(container.textContent).not.toMatch(/formule Ménage/i)
  })
})

describe('édition CNID : le ménage est ouvert', () => {
  it('le formulaire propose Ménage, préselectionné', () => {
    vi.stubEnv('VITE_EDITION', 'cnid')
    signup()
    expect(screen.getByRole('button', { name: 'Ménage' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('la page d’accueil présente la formule Découverte', () => {
    vi.stubEnv('VITE_EDITION', 'cnid')
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    )
    expect(screen.getByText('Découverte')).toBeTruthy()
  })

  it('la section des profils montre le ménage en inscription ouverte', () => {
    vi.stubEnv('VITE_EDITION', 'cnid')
    const { container } = render(
      <MemoryRouter>
        <ProfilesSection />
      </MemoryRouter>,
    )
    expect(container.textContent).toMatch(/Ménage en inscription ouverte/)
  })
})
