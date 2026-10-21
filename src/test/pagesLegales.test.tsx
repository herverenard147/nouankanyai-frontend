import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

/** CGU et confidentialité en pages (demande du propriétaire, 2026-10-21), règles par type de compte. */
import { CGU_SECTIONS, CguPage } from '@/pages/legal/CguPage'
import { PRIVACY_SECTIONS, PrivacyPage } from '@/pages/legal/PrivacyPage'

const text = (sections: typeof CGU_SECTIONS) =>
  sections.flatMap((s) => s.blocks.map((b) => (typeof b === 'string' ? b : b.list.join(' ')))).join(' ')

describe('pages légales', () => {
  it('CGU : sommaire, type de compte par section, nouvelles règles', () => {
    render(<MemoryRouter><CguPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Conditions Générales d’Utilisation' })).toBeTruthy()
    const toc = screen.getByRole('navigation', { name: 'Sommaire' })
    expect(within(toc).getAllByRole('link')).toHaveLength(CGU_SECTIONS.length)
    const scopes = new Set(CGU_SECTIONS.map((s) => s.scope))
    for (const scope of ['Tous les comptes', 'Ménage', 'PME', 'PME et Industrie']) expect(scopes.has(scope as never)).toBe(true)
    const all = text(CGU_SECTIONS)
    for (const rule of ['30 jours à partir du jour du paiement', '40 % des économies', '7 jours pour joindre', 'refusée automatiquement',
      'Une suspension ne coupe que les services', 'part provisoire', 'repasse en Découverte', 'Seul le client peut couper']) {
      expect(all).toContain(rule)
    }
    expect(all).not.toMatch(/—/)
  })

  it('confidentialité : factures et IA, paiements, conservation', () => {
    render(<MemoryRouter><PrivacyPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Politique de confidentialité' })).toBeTruthy()
    const all = text(PRIVACY_SECTIONS)
    for (const rule of ['après masquage', 'jamais envoyé à ce service', 'mode de paiement', '10 ans', 'compteur général']) expect(all).toContain(rule)
    expect(all).not.toMatch(/—/)
  })
})
