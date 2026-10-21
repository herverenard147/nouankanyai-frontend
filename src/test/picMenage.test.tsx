import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Pic de puissance du ménage, version simple, avec les ampères (demande du propriétaire, 2026-10-20). */
vi.mock('@/api/rawBackend', () => ({ rawPowerPeak: vi.fn(), rawSetBreaker: vi.fn() }))

import { rawPowerPeak, rawSetBreaker } from '@/api/rawBackend'
import { HouseholdPeakCard, shortestPeak } from '@/components/consumption/HouseholdPeakCard'
import type { BackendPowerPeak, BackendSitePeak } from '@/types/backend'

function site(over: Partial<BackendSitePeak> = {}): BackendSitePeak {
  return {
    site_id: 's1', site_nom: 'Domicile', source: 'somme_appareils', appareils: 2, ecart_releves_min: 5, souscription: null,
    basse_tension: true, pics: { '10': { kw: 3.2, debut: '2026-10-20T19:40:00', amperes: 16.2 }, '15': null, '60': null },
    quarts_kw: [], depassements: [], ...over,
  }
}

function peak(s: BackendSitePeak): BackendPowerPeak {
  return { jour: '2026-10-20', en_cours: true, fenetres_min: [10, 15, 60], sites: [s] }
}

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <HouseholdPeakCard />
    </QueryClientProvider>,
  )
}

describe('pic du ménage', () => {
  afterEach(() => vi.clearAllMocks())

  it('le plus court pic disponible', () => {
    expect(shortestPeak(site())?.minutes).toBe(10)
    expect(shortestPeak(site({ pics: { '10': null, '15': null, '60': { kw: 2, debut: '2026-10-20T19:00:00' } } }))?.minutes).toBe(60)
    expect(shortestPeak(site({ pics: { '10': null, '15': null, '60': null } }))).toBeNull()
  })

  it('kW, ampères et part du disjoncteur', async () => {
    vi.mocked(rawPowerPeak).mockResolvedValue(peak(site({ souscription: { valeur: 30, unite: 'A', cos_phi: 0.9, kw: 5.94, amperes: 30 } })))
    show()
    expect(await screen.findByText(/3,2\s*kW/)).toBeTruthy()
    expect(screen.getByText(/soit environ 16\s*A/)).toBeTruthy()
    expect(screen.getByText(/19 h 40/)).toBeTruthy()
    expect(screen.getByText(/54\s*%/)).toBeTruthy()
    expect(screen.queryByText(/Proche de la limite/)).toBeNull()
    expect(screen.getByRole('button', { name: 'Modifier le calibre du disjoncteur' })).toBeTruthy()
  })

  it('proche de la limite au-delà de 80 %', async () => {
    vi.mocked(rawPowerPeak).mockResolvedValue(
      peak(site({ souscription: { valeur: 6.6, unite: 'kVA', cos_phi: 0.9, kw: 5.94, amperes: 30 }, pics: { '10': { kw: 5.4, debut: '2026-10-20T20:00:00', amperes: 27.3 }, '15': null, '60': null } })),
    )
    show()
    expect(await screen.findByText(/Proche de la limite/)).toBeTruthy()
  })

  it('sans calibre : le formulaire l’enregistre', async () => {
    vi.mocked(rawPowerPeak).mockResolvedValue(peak(site()))
    vi.mocked(rawSetBreaker).mockResolvedValue({ site_id: 's1', amperes: 30 })
    show()
    const field = await screen.findByLabelText(/Calibre \(ampères\)/)
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    fireEvent.change(field, { target: { value: '30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(rawSetBreaker).toHaveBeenCalledWith(30))
  })

  it('pas encore de relevé', async () => {
    vi.mocked(rawPowerPeak).mockResolvedValue(peak(site({ pics: { '10': null, '15': null, '60': null } })))
    show()
    expect(await screen.findByText(/Pas encore assez de relevés/)).toBeTruthy()
  })
})
