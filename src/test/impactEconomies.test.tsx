import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Lot 2 des décisions CNID du 2026-11-10 : D13 (la tuile « Économies » valait toujours 0) et D3 (facteur CO2 lu dans
 * l'API, jamais recopié dans le site) ; « délestages automatiques » retiré du Journal ; type de rapport « Audit »
 * retiré tant qu'il n'a pas de contenu propre (S-08).
 */
vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, getCachedMachines: vi.fn(), rawBilling: vi.fn(), getCachedRecommend: vi.fn() }
})

vi.mock('@/hooks/queries/useJournal', () => ({ useJournal: () => ({ data: [], status: 'success' }) }))

import { fetchKpiSet, kpiIdsFor } from '@/api/kpis'
import { getCachedMachines, getCachedRecommend, rawBilling } from '@/api/rawBackend'
import { JournalPage } from '@/pages/app/JournalPage'
import { useSessionStore } from '@/store/sessionStore'

const FACTEUR = {
  kg_par_kwh: 0.5, // valeur volontairement différente de 0,436 : le site doit afficher ce que l'API envoie
  source: 'Source de test',
  annee: 2019,
  methode: 'estimation par facteur réseau, jamais une mesure',
}

function billing(economies: Record<string, unknown> | undefined) {
  return {
    statements: [],
    estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] },
    economies_estimees: economies,
  } as unknown as Awaited<ReturnType<typeof rawBilling>>
}

describe('tuile « Économies estimées ce mois » (D13)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCachedMachines).mockResolvedValue([])
    vi.mocked(getCachedRecommend).mockResolvedValue({ recommendations: [] } as unknown as Awaited<ReturnType<typeof getCachedRecommend>>)
  })

  it('montre le gain attendu des actions faites, en FCFA, kWh et kg CO2, étiqueté estimé', async () => {
    vi.mocked(rawBilling).mockResolvedValue(
      billing({ mois: '2026-11', actions_faites: 2, fcfa: 10184, kwh: 100, kg_co2: 50, provenance: 'estime', facteur_co2: FACTEUR }),
    )
    const tile = (await fetchKpiSet('pme'))['economies-mois']
    expect(tile.value).toMatch(/^10\s?184$/)
    expect(tile.unit).toBe('FCFA')
    expect(tile.provenance).toBe('estime')
    expect(tile.note).toMatch(/2 actions faites/)
    expect(tile.note).toMatch(/100 kWh/)
    expect(tile.note).toMatch(/50 kg CO2/)
  })

  it('sans action faite : le dit et renvoie au plan d’action, au lieu d’un 0 muet', async () => {
    vi.mocked(rawBilling).mockResolvedValue(
      billing({ mois: '2026-11', actions_faites: 0, fcfa: 0, kwh: 0, kg_co2: 0, provenance: 'estime', facteur_co2: FACTEUR }),
    )
    const tile = (await fetchKpiSet('industrie'))['economies-mois']
    expect(tile.value).toBe('-')
    expect(tile.note).toMatch(/plan d’action/i)
  })

  it('le ménage n’a pas de plan d’action : pas de tuile toujours à 0', () => {
    expect(kpiIdsFor('menage')).not.toContain('economies-mois')
    expect(kpiIdsFor('pme')).toContain('economies-mois')
  })
})

describe('Journal (A1-20)', () => {
  it('n’annonce plus de « délestages automatiques » qui n’existent pas', () => {
    useSessionStore.setState({ session: { profile: 'industrie' } } as never)
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <JournalPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    expect(container.textContent).not.toMatch(/délestages? automatiques?/i)
    expect(screen.getByText(/Ce que le système a constaté/)).toBeTruthy()
  })
})

describe('rapports (S-08)', () => {
  it('le type « Audit énergétique » n’est plus proposé : il copiait le rapport mensuel', async () => {
    const { REPORT_OPTIONS } = await import('@/pages/app/ReportsPage')
    for (const options of Object.values(REPORT_OPTIONS)) expect(options.types).not.toContain('energy_audit')
  })
})

describe('le site ne recopie pas le facteur CO2 (D3)', () => {
  it('aucun 0,436 ni 0.436 en dur dans le code du site', async () => {
    const files = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/test/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    const offenders = Object.entries(files).filter(([, text]) => /0[.,]436|0[.,]405/.test(text)).map(([path]) => path)
    expect(offenders).toEqual([])
  })
})
