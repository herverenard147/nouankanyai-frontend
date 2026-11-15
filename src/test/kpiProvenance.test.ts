import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendMachine } from '@/types/backend'

// S-15 : la provenance des tuiles suit la mesure réelle ou simulée, elle n'est plus « synthétique » en dur.
vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, getCachedMachines: vi.fn(), rawBilling: vi.fn(), getCachedRecommend: vi.fn(), rawConsumption: vi.fn() }
})

import { fetchKpiSet, kpiMeta } from '@/api/kpis'
import { queryClient } from '@/lib/queryClient'
import { getCachedMachines, getCachedRecommend, rawBilling, rawConsumption } from '@/api/rawBackend'

const machine = (id: string): BackendMachine => ({
  machine_id: id, nom: id, site_id: null, site_nom: 'S', power_kw: 2,
  temperature_c: null, vibration_mm_s: null, pressure_bar: null, has_reading: true,
  status: 'actif', priority: 'moyenne', categorie: null, marque: null, modele: null, numero_serie: null,
})
const conso = (provenances: Record<string, string | null>) =>
  ({ machines: Object.entries(provenances).map(([code, provenance]) => ({ code, provenance })) }) as unknown as Awaited<ReturnType<typeof rawConsumption>>

beforeAll(() => queryClient.setDefaultOptions({ queries: { retry: false } }))
beforeEach(() => {
  vi.mocked(rawBilling).mockResolvedValue({ statements: [], estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] } } as unknown as Awaited<ReturnType<typeof rawBilling>>)
  vi.mocked(getCachedRecommend).mockResolvedValue({ recommendations: [], count: 0 })
})

describe('provenance des tuiles de la vue d\'ensemble (S-15)', () => {
  it('mesure réelle : « mesure »', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine('A'), machine('B')])
    vi.mocked(rawConsumption).mockResolvedValue(conso({ A: 'mesure', B: 'mesure' }))
    const kpis = await fetchKpiSet('pme')
    expect(kpis['puissance-totale'].provenance).toBe('mesure')
    expect(kpis['anomalies-actives'].provenance).toBe('mesure')
  })
  it('relevés simulés : « synthétique »', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine('A')])
    vi.mocked(rawConsumption).mockResolvedValue(conso({ A: 'simulation' }))
    expect((await fetchKpiSet('pme'))['puissance-totale'].provenance).toBe('synthetique')
  })
  it('mélange : la moins sûre l\'emporte, jamais « mesuré » à tort', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine('A'), machine('B')])
    vi.mocked(rawConsumption).mockResolvedValue(conso({ A: 'mesure', B: 'simulation' }))
    expect((await fetchKpiSet('pme'))['puissance-totale'].provenance).toBe('synthetique')
  })
  it('relevés importés : « déclaré »', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine('A')])
    vi.mocked(rawConsumption).mockResolvedValue(conso({ A: 'declare' }))
    expect((await fetchKpiSet('menage'))['puissance-totale'].provenance).toBe('declare')
  })
  it('origine inconnue (consommation indisponible) : prudence, « synthétique »', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine('A')])
    vi.mocked(rawConsumption).mockRejectedValue(new Error('réseau'))
    expect((await fetchKpiSet('pme'))['puissance-totale'].provenance).toBe('synthetique')
  })
  it('plus de jargon « Puissance active totale »', () => {
    for (const profile of ['pme', 'industrie', 'menage'] as const) expect(kpiMeta(profile, 'puissance-totale').label).not.toMatch(/active totale/i)
  })
})
