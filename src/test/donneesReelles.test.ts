import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendMachine } from '@/types/backend'

// Volet 2 du plan corrigé (constats M7, M20 de l'audit du 2026-10-10) : aucune mesure inventée
// pour une machine sans relevé, et la provenance exacte des indicateurs.
vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, getCachedMachines: vi.fn(), rawPredict: vi.fn(), rawBilling: vi.fn() }
})

import { fetchKpiSet } from '@/api/kpis'
import { fetchMachinesTable } from '@/api/machinesTable'
import { fetchPredictionsBundle } from '@/api/prediction'
import { getCachedMachines, rawBilling, rawPredict } from '@/api/rawBackend'

function machine(overrides: Partial<BackendMachine> = {}): BackendMachine {
  return {
    machine_id: 'M1', nom: 'Pompe', site_id: null, site_nom: 'Non associé', power_kw: 4,
    temperature_c: null, vibration_hz: null, pressure_bar: null, has_reading: false,
    status: 'actif', priority: 'moyenne', categorie: null, marque: null, modele: null, numero_serie: null,
    ...overrides,
  }
}

describe('Machine sans relevé (M7)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('le tableau affiche « — », pas une valeur', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine()])
    const { rows } = await fetchMachinesTable('pme')
    expect(rows[0].temperature).toBe('—')
    expect(rows[0].vibration).toBe('—')
    expect(rows[0].pression).toBe('—')
    expect(rows[0].attendu).toBe('—')
  })

  it('affiche la consommation attendue quand l’appareil est relié à une fiche du référentiel', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine({
      estimation_reference: { kwh_jour: 9.6, cout_jour_fcfa: 663, heures_par_jour: 8, puissance_kw: 1.2, provenance: 'estime', source: 'manuel', confiance: 'fabricant' },
    })])
    const { rows } = await fetchMachinesTable('pme')
    expect(rows[0].attendu).toContain('9,6 kWh')
    expect(rows[0].attendu).toContain('(estimé)')
  })

  it('aucune prévision n’est demandée pour elle', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine()])
    const bundle = await fetchPredictionsBundle('pme', 'jour')
    expect(rawPredict).not.toHaveBeenCalled()
    expect(bundle.perDevice).toEqual([])
  })
})

describe('Provenance des indicateurs (M20)', () => {
  it('la puissance et les alertes, tirées de relevés simulés, sont « synthétiques »', async () => {
    vi.mocked(getCachedMachines).mockResolvedValue([machine({ temperature_c: 30, vibration_hz: 1, pressure_bar: 1, has_reading: true })])
    vi.mocked(rawBilling).mockResolvedValue({
      statements: [], estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] },
    } as unknown as Awaited<ReturnType<typeof rawBilling>>)
    const kpis = await fetchKpiSet('pme')
    expect(kpis['puissance-totale'].provenance).toBe('synthetique')
    expect(kpis['anomalies-actives'].provenance).toBe('synthetique')
  })
})
