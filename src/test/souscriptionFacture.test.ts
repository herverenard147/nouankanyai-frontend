import { describe, expect, it, vi } from 'vitest'

import type { BackendElectricityBill } from '@/types/backend'

/** Puissance souscrite lue sur la facture CIE (2026-10-20). */
vi.mock('@/api/rawBackend', () => ({
  rawBills: vi.fn(),
  rawAddManualBill: vi.fn(), rawAttachBillPhoto: vi.fn(), rawBillForecast: vi.fn(), rawBillPhoto: vi.fn(),
  rawConfirmBillActual: vi.fn(), rawDeleteBill: vi.fn(), rawUpdateBill: vi.fn(), rawUploadBillPhoto: vi.fn(),
}))
import { rawBills } from '@/api/rawBackend'
import { fetchInvoices } from '@/api/invoices'

const bill = (souscription_lue: BackendElectricityBill['souscription_lue']): BackendElectricityBill => ({
  id: 'b1', month: '2026-03', amount: '45 000 FCFA', amount_xof: 45000, source: 'ocr', is_forecast: false, actual_amount_xof: null,
  kwh_consumed: 312, document_type: 'facture_papier', payment_operator: null, payment_reference: null, has_photo: true,
  validation_status: 'en_attente', created_at: '2026-10-20T10:00:00', souscription_lue,
})

describe('facture : puissance souscrite lue', () => {
  it('enregistrée pour le site, ou la raison si elle ne l’est pas', async () => {
    vi.mocked(rawBills).mockResolvedValue([
      bill({ valeur: 15, unite: 'A', enregistree: true, site: 'Usine', raison: null }),
      bill({ valeur: 20, unite: 'A', enregistree: false, site: 'Usine', raison: 'différente de celle enregistrée (15 A) : vérifiez dans Paramètres' }),
      bill(null),
    ])
    const [a, b, c] = await fetchInvoices('pme')
    expect(a.fields.find((f) => f.key === 'souscription')?.value).toBe('15 A, enregistrée pour le site « Usine »')
    expect(b.fields.find((f) => f.key === 'souscription')?.value).toMatch(/20 A \(différente de celle enregistrée/)
    expect(c.fields.find((f) => f.key === 'souscription')).toBeUndefined()
  })
})
