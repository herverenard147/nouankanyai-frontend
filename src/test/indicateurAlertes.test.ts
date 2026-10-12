import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendMachine } from '@/types/backend'

// Audit du 2026-10-12 : la vue d'ensemble affichait « Aucune alerte active » et « 0 machine en
// anomalie » à côté d'une alerte listée. Les indicateurs lisent maintenant le même diagnostic.
vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, getCachedMachines: vi.fn(), rawBilling: vi.fn(), getCachedRecommend: vi.fn() }
})

import { fetchKpiSet } from '@/api/kpis'
import { getCachedMachines, getCachedRecommend, rawBilling } from '@/api/rawBackend'

function machine(overrides: Partial<BackendMachine> = {}): BackendMachine {
  return {
    machine_id: 'M1', nom: 'Compresseur', site_id: null, site_nom: 'Non associé', power_kw: 4,
    temperature_c: 30, vibration_hz: 1, pressure_bar: 1, has_reading: true,
    status: 'actif', priority: 'moyenne', categorie: null, marque: null, modele: null, numero_serie: null,
    ...overrides,
  }
}

describe('Indicateurs d’alerte de la vue d’ensemble', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rawBilling).mockResolvedValue({
      statements: [], estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] },
    } as unknown as Awaited<ReturnType<typeof rawBilling>>)
    vi.mocked(getCachedMachines).mockResolvedValue([machine(), machine({ machine_id: 'M2', nom: 'Four' })])
  })

  it('une machine au statut « actif » mais avec une alerte de diagnostic est comptée en anomalie', async () => {
    vi.mocked(getCachedRecommend).mockResolvedValue({
      recommendations: [{ machine_id: 'M1', type: 'alerte' }, { machine_id: 'M2', type: 'efficacite' }],
    } as unknown as Awaited<ReturnType<typeof getCachedRecommend>>)
    const kpis = await fetchKpiSet('industrie')
    expect(kpis['anomalies-actives'].value).toBe('1')
    expect(kpis['anomalies-actives'].note).toBe('Compresseur')
    expect(kpis['machines-actives'].note).toBe('1 en alerte')
  })

  it('sans réponse du moteur de recommandation, seuls les statuts comptent', async () => {
    vi.mocked(getCachedRecommend).mockRejectedValue(new Error('indisponible'))
    const kpis = await fetchKpiSet('industrie')
    expect(kpis['anomalies-actives'].value).toBe('0')
    expect(kpis['machines-actives'].note).toBe('Aucune alerte active')
  })
})
