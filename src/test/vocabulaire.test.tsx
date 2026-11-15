import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { crumbsFor } from '@/components/layout/Breadcrumb'
import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { LoginPage } from '@/pages/auth/LoginPage'

describe('vocabulaire unique', () => {
  it('la page /app/prediction s’appelle « Facture prévue » pour un ménage, « Prévision » ailleurs, jamais « Prédiction »', () => {
    for (const [profile, entries] of Object.entries(NAV_BY_PROFILE)) {
      const label = entries.find((e) => e.path === '/app/prediction')?.label
      if (profile === 'menage') expect(label).toBe('Facture prévue')
      else if (label) expect(label).toBe('Prévision')
    }
  })
  it('le fil d’Ariane d’un ménage dit « À surveiller », pas « Alertes »', () => {
    const labels = crumbsFor('menage', '/app/equipements/abc/alertes', 'Frigo').map((c) => c.label)
    expect(labels).toContain('À surveiller')
    expect(labels).not.toContain('Alertes')
    expect(crumbsFor('pme', '/app/equipements/abc/alertes', 'Frigo').map((c) => c.label)).toContain('Alertes')
  })
})

describe('page de connexion', () => {
  it('parle français et expose le type de compte choisi', () => {
    const { container } = render(<MemoryRouter initialEntries={['/login?mode=signup']}><LoginPage /></MemoryRouter>)
    expect(container.textContent).not.toMatch(/dashboard|landing/i)
    const pressed = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') !== null)
    expect(pressed.length).toBeGreaterThanOrEqual(5)
    const target = pressed.find((b) => b.getAttribute('aria-pressed') === 'false')!
    fireEvent.click(target)
    expect(target.getAttribute('aria-pressed')).toBe('true')
  })
})
