import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/pages/auth/LoginPage'
import { PricingSection } from '@/pages/landing/sections/PricingSection'
import { Hero } from '@/pages/landing/sections/Hero'

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
})
