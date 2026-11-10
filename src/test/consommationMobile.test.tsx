import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ConsumptionPage } from '@/pages/app/ConsumptionPage'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendConsumption } from '@/types/backend'

/**
 * N-01 (audit du 2026-11-10) : à 360 px, la page Consommation défilait de côté sur les trois comptes (369 px dans
 * 345). jsdom ne calcule pas de mise en page : ce test vérifie la règle qui l'évite, mesurée dans un navigateur par
 * l'audit : chaque tableau défile dans son propre cadre borné, et rien ne peut élargir la page (min-w-0, max-w-full).
 */
vi.mock('@/api/rawBackend', () => ({
  rawConsumption: vi.fn(),
  rawMainMeters: vi.fn().mockResolvedValue({ granularity: 'day', labels: [], compteurs: [] }),
  rawCreateMainMeter: vi.fn(),
  rawDeleteMainMeter: vi.fn(),
  rawSites: vi.fn().mockResolvedValue([]),
}))
import { rawConsumption } from '@/api/rawBackend'

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

const classes = (el: Element | null) => (el?.getAttribute('class') ?? '').split(/\s+/)

describe('Consommation sur téléphone (N-01)', () => {
  it('chaque tableau défile dans un cadre borné ; sections, filtres et liste d’appareils ne débordent pas', async () => {
    vi.mocked(rawConsumption).mockResolvedValue(data)
    useSessionStore.setState({
      session: { userId: 'u1', token: 't', refreshToken: 'r', profile: 'industrie', platformRole: null, displayName: 'X', subtitle: '', isTeamOwner: true, isTrial: false, isDemo: false },
    })
    const { container } = render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>
          <ConsumptionPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await screen.findByText('Ce que coûte chaque appareil')
    // Les tableaux « sr-only » des graphiques (lecteur d'écran) ne s'affichent pas.
    const tables = Array.from(container.querySelectorAll('table')).filter((t) => !t.closest('.sr-only'))
    expect(tables.length).toBeGreaterThanOrEqual(2)
    for (const table of tables) {
      const frame = table.closest('.overflow-x-auto')
      expect(frame).not.toBeNull()
      expect(classes(frame)).toContain('max-w-full')
    }
    for (const section of Array.from(container.querySelectorAll('section'))) {
      if (section.querySelector('.overflow-x-auto table')) expect(classes(section)).toContain('min-w-0')
    }
    expect(classes(container.firstElementChild)).toContain('min-w-0')
    expect(classes(container.querySelector('select'))).toContain('max-w-full')
  })
})
