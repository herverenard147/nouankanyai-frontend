import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { tariffShown } from '@/api/tariff'
import { ConsumptionPage } from '@/pages/app/ConsumptionPage'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendConsumption } from '@/types/backend'

/** Correction 7 du test du site (2026-10-18) : consommation réelle, tarif expliqué selon le type de compte. */
vi.mock('@/api/rawBackend', () => ({ rawConsumption: vi.fn() }))
import { rawConsumption } from '@/api/rawBackend'

const base: Omit<BackendConsumption, 'segment' | 'tarif'> = {
  granularity: 'day',
  since: '2026-09-19T00:00:00',
  until: '2026-10-19T00:00:00',
  labels: ['17/10', '18/10', '19/10'],
  starts: [],
  total: { kwh: 396, cout_fcfa: 25000, couverture_pct: 80, points: [198, null, 198], couts: [12500, null, 12500] },
  machines: [{ code: 'M1', nom: 'Compresseur', categorie: null, kwh: 396, cout_fcfa: 25000, couverture_pct: 80, part_pct: 100, provenance: 'declare', points: [198, null, 198] }],
  prix_note: 'Coût estimé au prix de chaque plage horaire.',
  factures_kwh_par_mois: [],
}

function renderAs(profile: 'industrie' | 'menage', data: BackendConsumption) {
  vi.mocked(rawConsumption).mockResolvedValue(data)
  useSessionStore.setState({
    session: { userId: 'u1', token: 't', refreshToken: 'r', profile, platformRole: null, displayName: 'X', subtitle: '', isTeamOwner: true, isTrial: false, isDemo: false },
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ConsumptionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Page Consommation', () => {
  afterEach(() => useSessionStore.setState({ session: null }))

  it('industrie : kWh, coût, source déclarée et plages horaires', async () => {
    renderAs('industrie', {
      ...base,
      segment: 'industrie',
      tarif: {
        kind: 'plages_horaires',
        explication: 'En moyenne tension, le prix du kWh dépend de l’heure.',
        plages: [
          { plage: 'creuses', heures: '23 h à 7 h', prix_fcfa_kwh: 57.17, kwh: 30, part_pct: 8 },
          { plage: 'pleines', heures: '7 h à 19 h', prix_fcfa_kwh: 69.09, kwh: 330, part_pct: 83 },
          { plage: 'pointe', heures: '19 h à 23 h', prix_fcfa_kwh: 94.21, kwh: 36, part_pct: 9 },
        ],
      },
    })
    await waitFor(() => expect(screen.getByText('Heures de pointe')).toBeTruthy())
    expect(screen.getByText('Déclaré')).toBeTruthy()
    expect(screen.getAllByText(/396/).length).toBeGreaterThan(0)
  })

  it('ménage : tranches par bimestre, jamais d’heures de pointe', async () => {
    renderAs('menage', {
      ...base,
      segment: 'menage',
      tarif: {
        kind: 'tranches_bimestre',
        explication: 'En basse tension, le prix ne dépend pas de l’heure.',
        tranches: [{ tranche: 1, prix_fcfa_kwh: 79.01, jusqu_a_kwh_par_kva: 180 }, { tranche: 2, prix_fcfa_kwh: 68.48, au_dela: true }],
        prime_fixe_bimestre_fcfa: 1470.94,
        kwh_61_derniers_jours: 210,
      },
    })
    await waitFor(() => expect(screen.getByText('Tranche 2')).toBeTruthy())
    expect(screen.queryByText(/pointe/i)).toBeNull()
    expect(tariffShown('menage')).toBe(false)
    expect(tariffShown('pme')).toBe(false)
    expect(tariffShown('industrie')).toBe(true)
  })

  it('sans relevé : la page le dit au lieu d’un graphique vide', async () => {
    renderAs('menage', {
      ...base,
      segment: 'menage',
      total: { kwh: 0, cout_fcfa: 0, couverture_pct: 0, points: [null, null, null], couts: [null, null, null] },
      machines: [],
      tarif: { kind: 'tranches_bimestre', explication: '…', tranches: [{ tranche: 1, prix_fcfa_kwh: 79.01, jusqu_a_kwh_par_kva: 180 }, { tranche: 2, prix_fcfa_kwh: 68.48 }] },
    })
    await waitFor(() => expect(screen.getByText(/Aucun relevé sur cette période/)).toBeTruthy())
  })
})
