import { describe, expect, it, vi } from 'vitest'

const cache = vi.hoisted(() => ({ getCachedMachines: vi.fn(), getCachedRecommend: vi.fn() }))
vi.mock('@/api/rawBackend', async (original) => ({ ...(await original<typeof import('@/api/rawBackend')>()), ...cache }))

import { fetchRecommendations } from '@/api/recommendations'

const base = { machine_id: 'M1', type: 'efficacite', severity: 'faible', description: 'd', action: 'a', gain_fcfa: 100, auto_resolu: false }

describe('provenance des recommandations', () => {
  it('un conseil tiré du référentiel est « estimé », un conseil du moteur reste « synthétique »', async () => {
    cache.getCachedMachines.mockResolvedValue([{ machine_id: 'M1' }])
    cache.getCachedRecommend.mockResolvedValue({
      recommendations: [
        { ...base, title: 'Frigo : 8 ans de service', vieillissement: { age_ans: 8, surconsommation_pct: 18 } },
        { ...base, title: 'Un modèle plus économe existe', alternative: { marque: 'LG', modele: 'X', inverter: true, source: 'energystar', confiance: 'energystar' } },
        { ...base, title: 'Conseil générique' },
      ],
    })
    const list = await fetchRecommendations('menage')
    expect(list.map((r) => r.provenance)).toEqual(['estime', 'estime', 'synthetique'])
  })
})
