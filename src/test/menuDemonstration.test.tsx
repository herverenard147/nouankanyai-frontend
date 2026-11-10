import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

/**
 * S-14 (audits du 2026-11-10, Q4 et A1-21) : 17 entrées de menu pour l'industrie et la PME, trop pour une démonstration
 * de quelques minutes. Un compte de démonstration voit d'abord 6 entrées ; le menu complet reste à un clic, et aucune
 * page n'est retirée (les droits ne changent pas).
 */
vi.mock('@/hooks/useNotificationBadges', () => ({ useAlertsBadgeCount: () => 0, useAdviceBadgeCount: () => 0 }))
vi.mock('@/components/layout/SensorDisclaimer', () => ({ SensorDisclaimer: () => null }))

import { SideRail } from '@/components/layout/SideRail'
import { DEMO_NAV_PATHS, NAV_BY_PROFILE, isRouteAllowed } from '@/lib/navConfig'
import { useSessionStore } from '@/store/sessionStore'

function show(profile: 'industrie' | 'pme', isDemo: boolean) {
  useSessionStore.setState({
    session: { userId: 'u', token: 't', refreshToken: 'r', profile, platformRole: null, displayName: 'X', subtitle: '', isTeamOwner: true, isTrial: false, isDemo },
  })
  render(
    <MemoryRouter>
      <SideRail />
    </MemoryRouter>,
  )
  return within(screen.getByRole('navigation', { name: 'Navigation principale' }))
}

describe('menu de démonstration (S-14)', () => {
  it('industrie de démonstration : 6 entrées, puis le menu complet à la demande', () => {
    const nav = show('industrie', true)
    expect(nav.getAllByRole('link').map((l) => l.textContent)).toEqual([
      "Vue d'ensemble", 'Alertes', 'Machines', 'Conso & coûts', 'Factures CIE', 'Rapports',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Afficher tout le menu' }))
    expect(nav.getAllByRole('link')).toHaveLength(NAV_BY_PROFILE.industrie.length)
  })

  it('PME de démonstration : Équipements au lieu de Machines', () => {
    const nav = show('pme', true)
    expect(nav.getAllByRole('link').map((l) => l.textContent)).toContain('Équipements')
    expect(nav.getAllByRole('link')).toHaveLength(6)
  })

  it('un compte réel garde son menu complet, sans bouton', () => {
    const nav = show('industrie', false)
    expect(nav.getAllByRole('link')).toHaveLength(NAV_BY_PROFILE.industrie.length)
    expect(screen.queryByRole('button', { name: 'Afficher tout le menu' })).toBeNull()
  })

  it('les entrées courtes sont toutes des pages permises au profil', () => {
    for (const profile of ['pme', 'industrie'] as const) {
      for (const path of DEMO_NAV_PATHS[profile]) expect(isRouteAllowed(path, profile), path).toBe(true)
    }
  })
})
