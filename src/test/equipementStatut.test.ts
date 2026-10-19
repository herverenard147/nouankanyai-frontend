import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/rawBackend', () => ({
  getCachedMachines: vi.fn().mockResolvedValue([
    { machine_id: 'F1', nom: 'Réfrigérateur vitrine', site_nom: 'Boutique', power_kw: 0.9, puissance_nominale_kw: 0.4, has_reading: true,
      temperature_c: 9, vibration_mm_s: null, pressure_bar: null, status: 'actif', priority: 'haute', categorie: 'refrigeration',
      marque: null, modele: null, numero_serie: null, estimation_reference: { kwh_jour: 3.2, cout_jour_fcfa: 250, heures_par_jour: 8, puissance_kw: 0.4, provenance: 'estime', source: 'fiche', confiance: 'estimee' } },
  ]),
  getCachedRecommend: vi.fn().mockResolvedValue({ recommendations: [{ type: 'alerte', machine_id: 'F1' }] }),
  hasReading: (m: { has_reading?: boolean }) => Boolean(m.has_reading),
}))
import { fetchEquipmentTable } from '@/api/equipment'

describe('Équipements : même statut que la vue d’ensemble, puissance et attendu', () => {
  it('appareil en alerte, puissance de plaque en W pour un ménage, attendu par jour', async () => {
    const { rows } = await fetchEquipmentTable('menage')
    expect(rows[0].statut).not.toBe('Opérationnel')
    expect(rows[0].puissance).toBe('400 W')
    expect(rows[0].attendu).toContain('3,2 kWh')
    const pme = await fetchEquipmentTable('pme')
    expect(pme.rows[0].puissance).toBe('0,4 kW')
  })
})
