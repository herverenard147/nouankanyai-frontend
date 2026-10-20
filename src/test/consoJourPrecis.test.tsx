import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendConsumption } from '@/types/backend'

/** Détail d'un jour précis (demande du propriétaire, 2026-10-20). */
vi.mock('@/api/rawBackend', () => ({
  rawConsumption: vi.fn(),
  rawPowerPeak: vi.fn().mockResolvedValue({ jour: '2026-10-19', en_cours: false, fenetres_min: [10, 15, 60], sites: [] }),
  rawMainMeters: vi.fn().mockResolvedValue({ granularity: 'day', labels: [], compteurs: [] }),
  rawCreateMainMeter: vi.fn(),
  rawDeleteMainMeter: vi.fn(),
  rawSites: vi.fn().mockResolvedValue([]),
}))
import { rawConsumption, rawPowerPeak } from '@/api/rawBackend'
import { ConsumptionPage } from '@/pages/app/ConsumptionPage'
import { useSessionStore } from '@/store/sessionStore'

const data: BackendConsumption = {
  granularity: 'hour',
  since: '2026-10-19T00:00:00',
  until: '2026-10-20T00:00:00',
  segment: 'industrie',
  labels: Array.from({ length: 24 }, (_, h) => `19/10 ${h} h`),
  starts: Array.from({ length: 24 }, (_, h) => `2026-10-19T${String(h).padStart(2, '0')}:00:00`),
  total: { kwh: 480, cout_fcfa: 33000, couverture_pct: 100, points: Array.from({ length: 24 }, () => 20), couts: Array.from({ length: 24 }, () => 1400) },
  machines: [],
  tarif: { kind: 'plages_horaires', explication: 'Le prix du kWh dépend de l’heure.', plages: [] },
  prix_note: 'Coût estimé au prix de chaque plage horaire.',
  factures_kwh_par_mois: [],
}

describe('Conso & coûts : jour précis', () => {
  it('le jour choisi est demandé heure par heure, et le pic suit ce jour', async () => {
    vi.mocked(rawConsumption).mockResolvedValue(data)
    useSessionStore.setState({
      session: { userId: 'u1', token: 't', refreshToken: 'r', profile: 'industrie', platformRole: null, displayName: 'X', subtitle: '', isTeamOwner: true, isTrial: false, isDemo: false },
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <ConsumptionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Jour précis' }))
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-19' } })
    await waitFor(() => expect(vi.mocked(rawConsumption)).toHaveBeenCalledWith('hour', undefined, '2026-10-19'))
    await waitFor(() => expect(screen.getByText(/Consommation, le lundi 19 octobre 2026, heure par heure/)).toBeTruthy())
    await waitFor(() => expect(vi.mocked(rawPowerPeak)).toHaveBeenCalledWith('2026-10-19'))
    expect(screen.queryByRole('button', { name: 'Hier' })).toBeNull()   // le jour vient du haut de la page
  })
})
