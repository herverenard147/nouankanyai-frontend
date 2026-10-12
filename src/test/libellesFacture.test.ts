import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendElectricityBill } from '@/types/backend'

// Une facture lue sur une photo ou saisie à la main n'est pas une « estimation » : la source dit
// d'où elle vient, et chaque valeur porte son état de vérification.
vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, rawBills: vi.fn() }
})

import { fetchInvoices } from '@/api/invoices'
import { rawBills } from '@/api/rawBackend'

function bill(overrides: Partial<BackendElectricityBill> = {}): BackendElectricityBill {
  return {
    id: 'B1', month: 'Juillet 2022', amount: '191 895 FCFA', amount_xof: 191895, source: 'ocr', is_forecast: false,
    actual_amount_xof: null, kwh_consumed: 2319, document_type: 'facture_papier', payment_operator: null,
    payment_reference: null, has_photo: true, validation_status: 'en_attente', created_at: '2026-10-12T00:00:00Z',
    ...overrides,
  }
}

async function fieldsOf(overrides: Partial<BackendElectricityBill> = {}) {
  vi.mocked(rawBills).mockResolvedValue([bill(overrides)])
  const [invoice] = await fetchInvoices('pme')
  return Object.fromEntries(invoice.fields.map((f) => [f.key, f]))
}

describe('Libellés d’une facture', () => {
  beforeEach(() => vi.clearAllMocks())

  it('facture lue sur photo, en attente : « Lue sur la photo » et « À valider »', async () => {
    const fields = await fieldsOf()
    expect(fields.source.value).toBe('Lue sur la photo')
    expect(fields.source.statusLabel).toBe('')
    expect(fields.montant.statusLabel).toBe('À valider')
    expect(fields.kwh.statusLabel).toBe('À valider')
  })

  it('facture saisie à la main puis validée : « Saisie à la main » et « Vérifié »', async () => {
    const fields = await fieldsOf({ source: 'manuel', validation_status: 'validee', document_type: null, has_photo: false })
    expect(fields.source.value).toBe('Saisie à la main')
    expect(fields.montant.statusLabel).toBe('Vérifié')
  })

  it('une prévision garde son badge de provenance', async () => {
    const fields = await fieldsOf({ source: 'statistique', is_forecast: true, kwh_consumed: null, document_type: null })
    expect(fields.montant.statusLabel).toBeUndefined()
    expect(fields.montant.provenance).toBe('synthetique')
  })
})
