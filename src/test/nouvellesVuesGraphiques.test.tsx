import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DAY_MS, HOUR_MS, hourlyDecor, hourlyPowerKw, mergeTimeline } from '@/lib/timeline'
import { ConsumptionPage } from '@/pages/app/ConsumptionPage'
import { useChartViewStore } from '@/store/chartViewStore'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendConsumption } from '@/types/backend'

/** Nouvelles vues des graphiques (2026-10-20) : hier, aujourd’hui et demain distingués ; l'ancienne vue reste. */
vi.mock('@/api/rawBackend', () => ({
  rawConsumption: vi.fn(),
  rawMainMeters: vi.fn().mockResolvedValue({ granularity: 'day', labels: [], compteurs: [] }),
  rawCreateMainMeter: vi.fn(),
  rawDeleteMainMeter: vi.fn(),
  rawSites: vi.fn().mockResolvedValue([]),
}))
import { rawConsumption } from '@/api/rawBackend'

const NOW = Date.parse('2026-10-20T10:30:00Z')

describe('Ligne de temps de la prédiction', () => {
  it('place le mesuré puis le prévu, sans chevauchement', () => {
    const past = [0, 1, 2, 3].map((h) => ({ at: Date.parse('2026-10-20T08:00:00Z') + (h - 2) * HOUR_MS, value: 10 + h }))
    const future = [0, 1].map((h) => ({ at: Date.parse('2026-10-20T09:00:00Z') + h * HOUR_MS, value: 20 + h }))
    const line = mergeTimeline(past, future, HOUR_MS)
    // Le relevé de 9 h est laissé de côté : à partir de 9 h, c'est le prévu.
    expect(line.past).toEqual([10, 11, 12, null, null])
    expect(line.future).toEqual([null, null, null, 20, 21])
    expect(line.nowIndex).toBe(3)
  })

  it('nomme hier, aujourd’hui et demain et marque chaque minuit', () => {
    const start = Date.parse('2026-10-19T00:00:00Z')
    const at = Array.from({ length: 72 }, (_, i) => start + i * HOUR_MS)
    const decor = hourlyDecor(at, NOW)
    expect(decor.zones.map((z) => z.label)).toEqual(['Hier', 'Aujourd’hui', 'Demain'])
    expect(decor.separators).toEqual([24, 48])
    expect(decor.ticks[24]).toMatch(/20 oct/)
    expect(decor.ticks[30]).toBe('6 h')
    expect(decor.ticks[31]).toBeNull()
  })

  it('heure en cours : puissance moyenne des minutes passées, rien sous un quart d’heure', () => {
    const tenOClock = Date.parse('2026-10-20T10:00:00Z')
    expect(hourlyPowerKw(tenOClock, 5, NOW)).toBeCloseTo(10)
    expect(hourlyPowerKw(tenOClock, 5, tenOClock + 10 * 60 * 1000)).toBeNull()
    expect(hourlyPowerKw(tenOClock - DAY_MS, 7, NOW)).toBe(7)
    expect(hourlyPowerKw(tenOClock, null, NOW)).toBeNull()
  })
})

const data: BackendConsumption = {
  granularity: 'day',
  since: '2026-09-19T00:00:00',
  until: '2026-10-19T00:00:00',
  segment: 'industrie',
  labels: ['17/10', '18/10', '19/10'],
  starts: ['2026-10-17T00:00:00', '2026-10-18T00:00:00', '2026-10-19T00:00:00'],
  total: { kwh: 600, cout_fcfa: 40000, couverture_pct: 90, points: [200, 200, 200], couts: [13000, 13000, 14000] },
  machines: [
    { code: 'M1', nom: 'Compresseur', categorie: null, kwh: 400, cout_fcfa: 30000, couverture_pct: 90, part_pct: 67, provenance: 'mesure', points: [130, 130, 140] },
    { code: 'M2', nom: 'Four', categorie: null, kwh: 200, cout_fcfa: 10000, couverture_pct: 90, part_pct: 33, provenance: 'mesure', points: [70, 70, 60] },
  ],
  tarif: { kind: 'plages_horaires', explication: 'Le prix du kWh dépend de l’heure.', plages: [] },
  prix_note: 'Coût estimé au prix de chaque plage horaire.',
  factures_kwh_par_mois: [],
  habitudes: { semaines: 4, kw: Array.from({ length: 7 }, () => Array.from({ length: 24 }, (_, h) => (h >= 7 && h < 19 ? 50 : 8))) },
}

function renderPage() {
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
}

describe('Conso & coûts : nouvelle vue seule', () => {
  afterEach(() => {
    useSessionStore.setState({ session: null })
    useChartViewStore.setState({ byPage: {} })
  })

  it('nouvelle vue par défaut : axes nommés, qui consomme quoi, habitudes avec leur échelle', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/Qui consomme quoi/)).toBeTruthy())
    expect(screen.getAllByText(/axe des ordonnées/).length).toBeGreaterThan(0)
    expect(screen.getByText('Ce que coûte chaque appareil')).toBeTruthy()
    expect(screen.getByText(/Habitudes : puissance moyenne/)).toBeTruthy()
    expect(screen.getByText(/Empilé : la hauteur totale/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Superposé' }))
    expect(screen.getByText(/Superposé : chaque courbe/)).toBeTruthy()
  })

  it('plus de choix de vue : la nouvelle vue est la seule (validée le 2026-10-20)', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByText(/Qui consomme quoi/)).toBeTruthy())
    expect(screen.queryByRole('button', { name: 'Ancienne vue' })).toBeNull()
    expect(screen.queryByText('Par appareil')).toBeNull()
  })

  it('un seul relevé ou des relevés arrêtés : la page le dit', async () => {
    vi.mocked(rawConsumption).mockResolvedValue({ ...data, total: { ...data.total, points: [null, 200, null], couts: [null, 13000, null] } })
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
    await waitFor(() => expect(screen.getByText(/Une seule période de cette fenêtre a des relevés \(18\/10\)/)).toBeTruthy())
  })
})

describe('Prédiction : intitulés des deux vues', () => {
  afterEach(() => useChartViewStore.setState({ byPage: {} }))

  it('« Mesuré et prévu » et « Prévision par appareil », choix gardé', async () => {
    const { ViewSwitch } = await import('@/components/charts/ViewSwitch')
    render(<ViewSwitch page="prediction" labels={{ nouvelle: 'Mesuré et prévu', ancienne: 'Prévision par appareil' }} />)
    expect(screen.getByRole('button', { name: 'Mesuré et prévu' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Prévision par appareil' }))
    expect(useChartViewStore.getState().byPage.prediction).toBe('ancienne')
    expect(screen.queryByText('Nouvelle vue')).toBeNull()
  })
})

describe('Aucun relevé : graphiques vides et expliqués', () => {
  afterEach(() => useSessionStore.setState({ session: null }))

  it('la courbe, la répartition et la grille des habitudes restent affichées, avec la raison', async () => {
    vi.mocked(rawConsumption).mockResolvedValue({
      ...data,
      total: { ...data.total, kwh: 0, cout_fcfa: 0, points: [null, null, null], couts: [null, null, null] },
      machines: data.machines.map((m) => ({ ...m, kwh: 0, cout_fcfa: 0, points: [null, null, null] })),
      habitudes: null,
    })
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
    await waitFor(() => expect(screen.getByText(/la courbe reste vide, rien n’est inventé/)).toBeTruthy())
    expect(screen.getAllByText(/axe des ordonnées/).length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/rien à répartir pour l’instant/)).toBeTruthy()
    expect(screen.getByText(/la grille se remplira/)).toBeTruthy()
  })
})
