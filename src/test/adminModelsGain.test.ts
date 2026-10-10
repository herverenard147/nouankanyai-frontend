import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, getCachedMlModels: vi.fn(), getCachedAdminMetrics: vi.fn() }
})

import { fetchAdminPanel } from '@/api/adminModels'
import { getCachedAdminMetrics, getCachedMlModels } from '@/api/rawBackend'

// Modèle v2 : le gain sur la moyenne de chaque machine est affiché, pas seulement le R².
describe('Panneau XGBoost du portail admin', () => {
  it('affiche le gain du modèle v2 sur la moyenne de chaque machine', async () => {
    vi.mocked(getCachedMlModels).mockResolvedValue([] as never)
    vi.mocked(getCachedAdminMetrics).mockResolvedValue({
      ml_health: { isolation_forest_anomalies_detected: 0, model_drift_status: 'inconnu' },
      model_metrics: {
        xgboost: { r2: 0.99, mae_kw: 0.3, mape_pct: 5, dataset: 'synthetic', computed_at: null },
        xgboost_v2: { r2: 0.9438, mae_kw: 11.33, mae_moyenne_machine_kw: 11.96, gain_vs_moyenne_machine: 0.052 },
      },
    } as never)
    const panel = await fetchAdminPanel('xgboost')
    const gain = panel.rows.find((r) => r.label.startsWith('v2 : gain'))
    expect(gain?.value).toContain('5,2 %')
    expect(gain?.value).toContain('11,3')
  })
})
