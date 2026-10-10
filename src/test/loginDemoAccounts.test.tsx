import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEMO_ACCOUNTS } from '@/data/demoAccounts'
import { LoginPage } from '@/pages/auth/LoginPage'

// Constat C6 de l'audit du 2026-10-10 : la page de connexion affichait, en production,
// les identifiants de 4 comptes dont le superadmin.
describe('Page de connexion : comptes de démonstration', () => {
  afterEach(() => vi.unstubAllEnvs())

  function renderLogin() {
    return render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    )
  }

  it('n’affiche aucun identifiant hors développement', () => {
    vi.stubEnv('DEV', false)
    renderLogin()
    expect(screen.queryByText(/Comptes de démonstration/i)).toBeNull()
    expect(screen.queryByText('demo1234')).toBeNull()
  })

  it('ne liste jamais un compte administrateur, même en développement', () => {
    expect(DEMO_ACCOUNTS.map((a) => a.email)).not.toContain('admin@nouankany.demo')
    vi.stubEnv('DEV', true)
    renderLogin()
    expect(screen.queryByText('admin@nouankany.demo')).toBeNull()
  })
})
