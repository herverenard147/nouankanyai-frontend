import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Correction 8 du test du site (2026-10-18) : une seule cloche, compteur, liste déroulante, clic vers l'élément. */
vi.mock('@/api/rawBackend', () => ({ rawNotifications: vi.fn() }))
vi.mock('@/api/advice', () => ({ fetchAdvice: vi.fn() }))

import { fetchAdvice } from '@/api/advice'
import { rawNotifications } from '@/api/rawBackend'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { notificationLabel } from '@/lib/notificationLinks'
import { useNotificationStore } from '@/store/notificationStore'
import type { Profile } from '@/types/domain'

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.hash}</p>
}

function afficher(profile: Profile) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/app/apercu']}>
        <NotificationBell profile={profile} />
        <Routes>
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('cloche des notifications', () => {
  afterEach(() => useNotificationStore.getState().resetSeen())

  it('compte tout ce qui notifie, liste au clic, mène à l’élément et le marque vu', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([
      { id: 'alerte:a1', kind: 'alerte', title: 'Alerte sur Four', detail: 'Surchauffe', at: '2026-10-19T08:00:00', link: '/app/alertes#alerte-a1', level: 'alerte' },
      { id: 'facture:f1:validee', kind: 'facture', title: 'Facture 2026-09 validée', detail: '', at: '2026-10-19T07:00:00', link: '/app/factures#facture-f1', level: 'info' },
    ])
    vi.mocked(fetchAdvice).mockResolvedValue([
      { rank: '1', title: 'Réglez le climatiseur à 25 °C', detail: 'd', impactLabel: '5 000 FCFA', impactKind: 'gain', provenance: 'estime', machineId: 'M1' },
    ])
    afficher('industrie')
    const cloche = await screen.findByRole('button', { name: 'Notifications : 3 nouvelles' })
    expect(cloche).toHaveTextContent('3')

    fireEvent.click(cloche)
    expect(screen.getByRole('region', { name: 'Notifications' })).toBeTruthy()
    expect(screen.getByText('Réglez le climatiseur à 25 °C')).toBeTruthy()

    fireEvent.click(screen.getByText('Facture 2026-09 validée'))
    expect(screen.getByTestId('where')).toHaveTextContent('/app/factures#facture-f1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Notifications : 2 nouvelles' })).toBeTruthy())
    expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull()
  })

  it('« tout marquer comme vu » remet le compteur à zéro', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([
      { id: 'plan:p1:2026-10', kind: 'plan', title: 'Action en retard', detail: '', at: null, link: '/app/plan-action#plan-p1', level: 'info' },
    ])
    vi.mocked(fetchAdvice).mockResolvedValue([])
    afficher('pme')
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications : 1 nouvelle' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tout marquer comme vu' }))
    expect(screen.getByRole('button', { name: 'Notifications : rien de nouveau' })).not.toHaveTextContent(/\d/)
  })

  it('absente pour un profil sans notifications de compte (technicien, admin)', () => {
    afficher('technicien')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('libellés', () => {
    expect(notificationLabel(0)).toBe('Notifications : rien de nouveau')
    expect(notificationLabel(1)).toBe('Notifications : 1 nouvelle')
  })
})
