import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendApplianceDetail } from '@/types/backend'

/** Page d'un appareil (maquette validée, 2026-10-20). */
const starts = Array.from({ length: 169 }, (_, i) => new Date(Date.parse('2026-10-13T11:00:00Z') + i * 3600_000).toISOString().slice(0, 19))
const detail: BackendApplianceDetail = {
  code: 'CMP-1', nom: 'Compresseur à vis', categorie: 'Compresseur', puissance_nominale_kw: 37, periode: '7j', pas_min: 60, starts,
  puissance_kw: starts.map((_, i) => (i % 24 >= 7 && i % 24 < 19 ? 30 : 3)), temperature_c: starts.map(() => 5), vibration_mm_s: starts.map(() => null), pression_bar: starts.map(() => null),
  seuils: { puissance_kw: 44.4, temperature_max_c: 8, vibration_max_mm_s: 4.5 },
  jours: Array.from({ length: 7 }, (_, d) => ({ jour: `2026-10-${13 + d}`, kwh: 396, cout_fcfa: 27000 })),
  kwh: 2772, cout_fcfa: 189000, couverture_pct: 100, heures_marche_par_jour: 12, part_compte_pct: 61, attendu_kwh_jour: 444,
  attendu_source: 'estimation : puissance nominale × heures d’usage habituelles de sa famille', kwh_par_jour: 396, ecart_attendu_pct: -10.8,
  habitude: { semaine: Array.from({ length: 24 }, (_, h) => (h >= 7 && h < 19 ? 30 : 3)), weekend: Array.from({ length: 24 }, () => 3) },
  derniere_mesure_at: '2026-10-20T11:00:00',
}
vi.mock('@/api/rawBackend', () => ({ rawApplianceDetail: vi.fn() }))
vi.mock('@/hooks/queries/usePrediction', () => ({ usePredictionsBundle: () => ({ status: 'success', data: { global: null, perDevice: [] } }) }))
vi.mock('@/hooks/queries/useAlertRegistry', () => ({ useAlertRegistry: () => ({ status: 'success', data: [] }) }))
import { rawApplianceDetail } from '@/api/rawBackend'
import { MachineDetailPage } from '@/pages/app/MachineDetailPage'
import { useBreadcrumbStore } from '@/store/breadcrumbStore'

describe('page d’un appareil', () => {
  it('chiffres, courbes face aux seuils, attendu, habitude ; période au choix', async () => {
    vi.mocked(rawApplianceDetail).mockResolvedValue(detail)
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/app/machines/CMP-1']}>
          <Routes>
            <Route path="/app/machines/:code" element={<MachineDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await waitFor(() => expect(screen.getByText('Heures de marche par jour')).toBeTruthy())
    expect(screen.getByText('-11 %')).toBeTruthy()
    expect(screen.getByText(/attendu : 444,0 kWh par jour/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Température' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Vibration' })).toBeNull()   // aucune mesure : pas de courbe vide inutile
    expect(screen.getAllByText(/Seuil 44,4 kW/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Habitude : puissance moyenne par heure/)).toBeTruthy()
    expect(useBreadcrumbStore.getState().label).toBe('Compresseur à vis')
    fireEvent.click(screen.getByRole('button', { name: '30 jours' }))
    await waitFor(() => expect(vi.mocked(rawApplianceDetail)).toHaveBeenCalledWith('CMP-1', '30j'))
  })
})
