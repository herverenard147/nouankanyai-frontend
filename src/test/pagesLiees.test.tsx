import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { RelatedPages, relatedPages } from '@/components/layout/RelatedPages'
import { NAV_BY_PROFILE, visibleNav } from '@/lib/navConfig'

const rendu = (profile: 'industrie' | 'menage', path: string) =>
  render(<MemoryRouter initialEntries={[path]}><RelatedPages profile={profile} /></MemoryRouter>)

describe('pages liées : une page rangée reste atteignable depuis son parent', () => {
  it('sur la page parente : le parent puis ses pages rangées', () => {
    expect(relatedPages('industrie', '/app/conseils').map((page) => page.label)).toEqual(['Conseils', 'Recommandations', "Plan d'action"])
  })
  it('sur une page rangée : le même groupe, pour passer de l\'une à l\'autre', () => {
    expect(relatedPages('industrie', '/app/plan-action').map((page) => page.label)).toEqual(['Conseils', 'Recommandations', "Plan d'action"])
  })
  it('un sous-chemin hérite du groupe de sa page (fiche d\'une demande de l\'admin)', () => {
    expect(relatedPages('admin', '/app/admin/leads/42').map((page) => page.label)).toEqual(["Demandes d'audit", 'Messages et inscriptions'])
  })
  it('une page sans groupe n\'affiche rien', () => {
    expect(relatedPages('industrie', '/app/machines')).toEqual([])
    const { container } = rendu('industrie', '/app/machines')
    expect(container).toBeEmptyDOMElement()
  })
  it('rendu accessible : navigation nommée, page courante signalée', () => {
    rendu('industrie', '/app/recommandations')
    expect(screen.getByRole('navigation', { name: 'Pages liées' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Recommandations' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Conseils' })).not.toHaveAttribute('aria-current')
  })
  it('chaque page rangée, pour chaque profil, est dans un groupe dont le parent est visible', () => {
    for (const profile of ['menage', 'pme', 'industrie', 'admin'] as const) {
      const shown = visibleNav(profile).map((entry) => entry.path)
      for (const entry of NAV_BY_PROFILE[profile].filter((e) => e.under)) {
        const group = relatedPages(profile, entry.path).map((page) => page.path)
        expect(group, `${profile} ${entry.path}`).toContain(entry.path)
        expect(shown, `${profile} ${entry.path}`).toContain(group[0])
      }
    }
  })
})

describe('parents revus (2026-11-15)', () => {
  it('Rapports sous Ma consommation / Conso & coûts, Abonnement sous Paramètres, jamais sous les factures', () => {
    const parent = (profile: 'menage' | 'pme' | 'industrie', path: string) => NAV_BY_PROFILE[profile].find((e) => e.path === path)?.under
    expect(parent('menage', '/app/rapports')).toBe('/app/consommation')
    expect(parent('pme', '/app/rapports')).toBe('/app/consommation')
    expect(parent('industrie', '/app/rapports')).toBe('/app/consommation')
    expect(parent('menage', '/app/facturation')).toBe('/app/parametres')
    expect(relatedPages('menage', '/app/factures')).toEqual([])
  })
  it('Prix du matériel (commande fermée) n’a plus d’entrée de menu mais garde sa route, sous Paramètres', () => {
    const prix = NAV_BY_PROFILE.admin.find((e) => e.path === '/app/admin/prix-materiel')
    expect(prix?.under).toBe('/app/parametres')
    expect(visibleNav('admin').map((e) => e.path)).not.toContain('/app/admin/prix-materiel')
  })
})
