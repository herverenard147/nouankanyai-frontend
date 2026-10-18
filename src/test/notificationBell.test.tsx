import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useNotificationBadges', () => ({ useAlertsBadgeCount: vi.fn(), useAdviceBadgeCount: () => 0 }))

import { NotificationBell, notificationLabel } from '@/components/layout/NotificationBell'
import { useAlertsBadgeCount } from '@/hooks/useNotificationBadges'
import type { Profile } from '@/types/domain'

function afficher(profile: Profile, count: number) {
  vi.mocked(useAlertsBadgeCount).mockReturnValue(count)
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <NotificationBell profile={profile} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('cloche des notifications (barre du haut et menu)', () => {
  it('mène aux alertes et affiche le nombre de nouvelles alertes', () => {
    afficher('menage', 3)
    const lien = screen.getByRole('link', { name: 'Notifications : 3 nouvelles alertes' })
    expect(lien).toHaveAttribute('href', '/app/alertes')
    expect(lien).toHaveTextContent('3')
  })

  it('sans nouvelle alerte : pas de pastille, libellé explicite', () => {
    afficher('pme', 0)
    const lien = screen.getByRole('link', { name: 'Notifications : aucune nouvelle alerte' })
    expect(lien).not.toHaveTextContent(/\d/)
  })

  it('absente pour un profil sans page d’alertes (technicien)', () => {
    afficher('technicien', 2)
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('accorde le libellé au singulier et plafonne la pastille', () => {
    expect(notificationLabel(1)).toBe('Notifications : 1 nouvelle alerte')
    afficher('industrie', 150)
    expect(screen.getByRole('link')).toHaveTextContent('99+')
  })
})
