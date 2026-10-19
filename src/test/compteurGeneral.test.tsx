import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/** Compteur général comparé à la somme des appareils (demande du propriétaire, 2026-10-19). */
vi.mock('@/api/rawBackend', () => ({
  rawMainMeters: vi.fn(),
  rawCreateMainMeter: vi.fn().mockResolvedValue({ code: 'CPT-1' }),
  rawDeleteMainMeter: vi.fn().mockResolvedValue(undefined),
  rawSites: vi.fn().mockResolvedValue([{ id: 's1', nom: 'Usine' }]),
}))
import { rawCreateMainMeter, rawMainMeters } from '@/api/rawBackend'
import { MainMeterCard } from '@/components/consumption/MainMeterCard'

function page() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MainMeterCard granularity="day" window="30 derniers jours" profile="industrie" />
    </QueryClientProvider>,
  )
}

describe('Compteur général', () => {
  it('sans compteur : on peut le déclarer pour le site', async () => {
    vi.mocked(rawMainMeters).mockResolvedValue({ granularity: 'day', labels: [], compteurs: [] })
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Déclarer le compteur général' }))
    await waitFor(() => expect(rawCreateMainMeter).toHaveBeenCalledWith('s1'))
  })

  it('avec compteur : mesuré, somme des appareils, part non suivie et verdict', async () => {
    vi.mocked(rawMainMeters).mockResolvedValue({
      granularity: 'day', labels: ['lun. 1', 'mar. 2'],
      compteurs: [{
        code: 'CPT-1', nom: 'Compteur général', site: 'Usine', appareils_suivis: 4, compteur_kwh: 600, appareils_kwh: 500,
        ecart_kwh: 100, ecart_pct: 16.7, couverture_compteur_pct: 98, couverture_appareils_pct: 95,
        verdict: '16,7 % de la consommation du site n’est pas suivie.', points_compteur: [300, 300], points_appareils: [250, 250],
      }],
    })
    page()
    expect(await screen.findByText('600 kWh')).toBeTruthy()
    expect(screen.getByText('500 kWh')).toBeTruthy()
    expect(screen.getByText('16,7 %')).toBeTruthy()
    expect(screen.getByText('16,7 % de la consommation du site n’est pas suivie.')).toBeTruthy()
  })
})
