import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendPowerPeak } from '@/types/backend'

/** Pic de puissance tenu face à la puissance souscrite (2026-10-20). */
const mutate = vi.fn()
vi.mock('@/api/rawBackend', () => ({ rawPowerPeak: vi.fn() }))
vi.mock('@/hooks/queries/useSites', () => ({
  useSites: () => ({ status: 'success', data: [{ id: 's1', nom: 'Usine', localisation: 'Yopougon', user_id: 'u', souscription_valeur: null, souscription_unite: null }] }),
  useCreateSite: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null }),
  useDeleteSite: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null }),
  useSetSiteSubscription: () => ({ mutate, reset: vi.fn(), isPending: false, error: null }),
}))
vi.mock('@/hooks/queries/useBoitiers', () => ({ useBoitiers: () => ({ data: [] }) }))
import { rawPowerPeak } from '@/api/rawBackend'
import { PowerPeakSection } from '@/components/consumption/PowerPeakSection'
import { SitesCard } from '@/components/settings/SitesCard'

const quarters = Array.from({ length: 96 }, (_, q) => (q >= 42 && q < 45 ? 97 : 60))

function renderPeak(data: BackendPowerPeak) {
  vi.mocked(rawPowerPeak).mockResolvedValue(data)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PowerPeakSection />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const site = {
  site_id: 's1',
  site_nom: 'Usine',
  source: 'somme_appareils' as const,
  appareils: 2,
  ecart_releves_min: 1,
  souscription: { valeur: 90, unite: 'kW' as const, cos_phi: 0.9, kw: 90 },
  pics: { '10': { kw: 99, debut: '2026-10-19T10:40:00' }, '15': { kw: 97, debut: '2026-10-19T10:30:00' }, '60': { kw: 84, debut: '2026-10-19T10:15:00' } },
  quarts_kw: quarters,
  depassements: [{ debut: '2026-10-19T10:30:00', fin: '2026-10-19T11:15:00', minutes: 45, max_kw: 97 }],
}

describe('Pic de puissance', () => {
  it('trois durées, puissance souscrite et dépassement daté', async () => {
    renderPeak({ jour: '2026-10-19', en_cours: false, fenetres_min: [10, 15, 60], sites: [site] })
    await waitFor(() => expect(screen.getByText('Pic tenu 10 min')).toBeTruthy())
    expect(screen.getByText(/à 10 h 40/)).toBeTruthy()
    expect(screen.getByText(/de 10 h 30 à 11 h 15 \(45 min\), jusqu’à 97 kW/)).toBeTruthy()
    expect(screen.getAllByText(/Puissance souscrite 90 kW/).length).toBeGreaterThan(0)
  })

  it('relevés horaires : 10 et 15 min non calculés, la page dit pourquoi ; souscription absente : lien vers Paramètres', async () => {
    renderPeak({
      jour: '2026-10-19',
      en_cours: false,
      fenetres_min: [10, 15, 60],
      sites: [{ ...site, ecart_releves_min: 60, souscription: null, depassements: [], pics: { '10': null, '15': null, '60': site.pics['60'] } }],
    })
    await waitFor(() => expect(screen.getAllByText(/relevés trop espacés \(un toutes les 60 min\)/).length).toBe(2))
    expect(screen.getByRole('link', { name: 'la saisir dans Paramètres' })).toBeTruthy()
  })

  it('aucun relevé : courbe vide expliquée', async () => {
    renderPeak({ jour: '2026-10-19', en_cours: false, fenetres_min: [10, 15, 60], sites: [{ ...site, quarts_kw: quarters.map(() => null), pics: { '10': null, '15': null, '60': null }, depassements: [] }] })
    await waitFor(() => expect(screen.getByText(/Aucun relevé ce jour-là/)).toBeTruthy())
  })
})

describe('Paramètres : puissance souscrite d’un site', () => {
  it('ampères du disjoncteur, cos φ facultatif', () => {
    render(<SitesCard />)
    expect(screen.getByText(/Puissance souscrite : non renseignée/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Puissance souscrite du site Usine' }))
    fireEvent.change(screen.getByLabelText('Valeur'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Unité'), { target: { value: 'A' } })
    expect(screen.getByText(/10 A font 2,2 kVA/)).toBeTruthy()
    fireEvent.submit(screen.getByLabelText('Valeur').closest('form') as HTMLFormElement)
    expect(mutate).toHaveBeenCalledWith({ siteId: 's1', valeur: 15, unite: 'A', cos_phi: null }, expect.anything())
  })
})
