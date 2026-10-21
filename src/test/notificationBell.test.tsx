import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Correction 8 du test du site (2026-10-18) : une seule cloche, compteur, liste déroulante, clic vers l'élément. */
vi.mock('@/api/rawBackend', () => ({ rawNotifications: vi.fn(), rawBilling: vi.fn(() => Promise.reject(new Error('sans abonnement'))) }))
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

function afficher(profile: Profile, path = '/app/apercu') {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
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

  it('absente pour un technicien', () => {
    afficher('technicien')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('administrateur : la collecte prête pour le réentraînement est notifiée', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([
      { id: 'collecte-prete:12', kind: 'collecte', title: 'Données réelles prêtes', detail: '', at: '2026-10-20T08:00:00', link: '/app/admin/donnees', level: 'info' },
    ])
    vi.mocked(fetchAdvice).mockResolvedValue([])
    afficher('admin')
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications : 1 nouvelle' }))
    fireEvent.click(screen.getByText('Données réelles prêtes'))
    expect(screen.getByTestId('where')).toHaveTextContent('/app/admin/donnees')
  })

  /** Test du site en ligne, 2026-10-20. */
  it('industrie : un boîtier muet mène à « Sources de mesures », pas à une page interdite', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([
      { id: 'boitier:d1:2026102008', kind: 'boitier', title: 'Le boîtier Atelier n’envoie plus rien', detail: '', at: '2026-10-20T08:00:00', link: '/app/boitier/d1', level: 'alerte' },
    ])
    vi.mocked(fetchAdvice).mockResolvedValue([])
    afficher('industrie')
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications : 1 nouvelle' }))
    fireEvent.click(screen.getByText('Le boîtier Atelier n’envoie plus rien'))
    expect(screen.getByTestId('where')).toHaveTextContent('/app/sources/d1')
  })

  it('une panne déjà en alerte n’est pas répétée en conseil ; les nombres sont à la française', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([
      { id: 'alerte:a1', kind: 'alerte', title: 'Alerte sur Four', detail: 'Four consomme 4.4kW', at: '2026-10-19T08:00:00', link: '/app/alertes#alerte-a1', level: 'alerte', machine: 'M1' },
    ])
    vi.mocked(fetchAdvice).mockResolvedValue([
      { rank: '1', title: 'Anomalie détectée sur Four', detail: 'd', impactLabel: '', impactKind: 'severity', provenance: 'estime', machineId: 'M1' },
      { rank: '2', title: 'Décalez la cuisson', detail: 'd', impactLabel: '3 000 FCFA', impactKind: 'gain', provenance: 'estime', machineId: 'M1' },
    ])
    afficher('pme')
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications : 2 nouvelles' }))
    expect(screen.queryByText('Anomalie détectée sur Four')).toBeNull()
    expect(screen.getByText('Décalez la cuisson')).toBeTruthy()
    expect(screen.getByText(/4,4\s?kW/)).toBeTruthy()
  })

  it('ouvrir la page Alertes marque les alertes vues, comme le compteur du menu', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([
      { id: 'alerte:a1', kind: 'alerte', title: 'Alerte sur Four', detail: '', at: '2026-10-19T08:00:00', link: '/app/alertes#alerte-a1', level: 'alerte' },
      { id: 'facture:f1:validee', kind: 'facture', title: 'Facture validée', detail: '', at: '2026-10-19T07:00:00', link: '/app/factures#facture-f1', level: 'info' },
    ])
    vi.mocked(fetchAdvice).mockResolvedValue([])
    afficher('pme', '/app/alertes')
    expect(await screen.findByRole('button', { name: 'Notifications : 1 nouvelle' })).toBeTruthy()
  })

  it('Échap ferme la liste et rend la main à la cloche', async () => {
    vi.mocked(rawNotifications).mockResolvedValue([])
    vi.mocked(fetchAdvice).mockResolvedValue([])
    afficher('pme')
    const cloche = await screen.findByRole('button', { name: 'Notifications : rien de nouveau' })
    fireEvent.click(cloche)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('region', { name: 'Notifications' })).toBeNull()
    expect(document.activeElement).toBe(cloche)
  })

  it('libellés', () => {
    expect(notificationLabel(0)).toBe('Notifications : rien de nouveau')
    expect(notificationLabel(1)).toBe('Notifications : 1 nouvelle')
  })
})
