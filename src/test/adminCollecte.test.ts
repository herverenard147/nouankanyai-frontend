import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, rawMlCollection: vi.fn() }
})

import { adminPanelIds, fetchAdminPanel } from '@/api/adminModels'
import { rawMlCollection } from '@/api/rawBackend'

describe('Panneau « Collecte de mesures réelles »', () => {
  it('montre l’avancement vers le seuil de réentraînement', async () => {
    vi.mocked(rawMlCollection).mockResolvedValue({
      releves_reels: 1234, machines_mesurees: 3, machines_avec_un_mois: 1,
      seuil_reentrainement: { machines: 20, heures_par_machine: 720, couverture: 0.8 }, pret_pour_reentrainement: false,
    })
    expect(adminPanelIds()[0]).toBe('collecte')
    const panel = await fetchAdminPanel('collecte')
    expect(panel.badge).toBe('collecte en cours')
    expect(panel.rows.find((r) => r.label.includes('depuis un mois'))?.value).toBe('1 sur 20 nécessaires')
  })
})
