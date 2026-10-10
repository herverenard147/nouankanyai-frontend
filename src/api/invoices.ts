import {
  rawAddManualBill,
  rawAttachBillPhoto,
  rawBillForecast,
  rawBillPhoto,
  rawBills,
  rawConfirmBillActual,
  rawDeleteBill,
  rawUpdateBill,
  rawUploadBillPhoto,
} from '@/api/rawBackend'
import { formatFcfa, formatNumberFr, NARROW_NBSP } from '@/lib/formatters'
import type { BackendElectricityBill } from '@/types/backend'
import type { InvoiceRecord, OcrField, Profile } from '@/types/domain'

const SOURCE_LABEL: Record<BackendElectricityBill['source'], string> = {
  manuel: 'estimé',
  ocr: 'estimé',
  'ocr-mock': 'estimé',
  statistique: 'synthétique',
  demo: 'démonstration',
}

const VALIDATION_LABEL = {
  en_attente: 'En attente de validation',
  validee: 'Validée, base des relevés',
  rejetee: 'Rejetée',
} as const

function toInvoiceRecord(bill: BackendElectricityBill): InvoiceRecord {
  const fields: OcrField[] = [
    { key: 'periode', label: 'Période facturée', value: bill.month, provenance: 'estime', editable: false },
    {
      key: 'montant',
      label: bill.is_forecast ? 'Montant prévu' : 'Montant TTC',
      value: bill.amount ?? '—',
      provenance: bill.is_forecast ? 'synthetique' : 'estime',
      editable: false,
    },
  ]
  if (bill.kwh_consumed !== null) {
    fields.push({ key: 'kwh', label: 'Consommation', value: `${formatNumberFr(bill.kwh_consumed)}${NARROW_NBSP}kWh`, provenance: 'estime', editable: false })
  }
  if (bill.actual_amount_xof !== null) {
    fields.push({
      key: 'reel',
      label: 'Montant réel confirmé',
      value: formatFcfa(bill.actual_amount_xof),
      provenance: 'estime',
      editable: false,
    })
  }
  // Détail NouankanyAI (extraction par photo uniquement, voir document_type sur
  // BackendElectricityBill) : le type de document et, pour un paiement numérique,
  // l'opérateur et la référence de transaction — jamais affichés pour une saisie
  // manuelle ou une prévision, où ces champs sont toujours null côté backend.
  if (bill.document_type === 'recu_paiement_numerique') {
    fields.push({ key: 'type_document', label: 'Type de document', value: 'Reçu de paiement numérique', provenance: 'estime', editable: false })
    if (bill.payment_operator) {
      fields.push({ key: 'operateur', label: 'Opérateur de paiement', value: bill.payment_operator, provenance: 'estime', editable: false })
    }
  } else if (bill.document_type === 'facture_papier') {
    fields.push({ key: 'type_document', label: 'Type de document', value: 'Facture CIE papier', provenance: 'estime', editable: false })
  }
  if ((bill.period_months ?? 1) > 1) {
    fields.push({ key: 'duree', label: 'Durée couverte', value: `${bill.period_months} mois (bimestrielle)`, provenance: 'estime', editable: false })
  }
  if (bill.payment_reference) {
    fields.push({ key: 'reference', label: 'Référence', value: bill.payment_reference, provenance: 'estime', editable: false })
  }
  fields.push({ key: 'source', label: 'Source', value: SOURCE_LABEL[bill.source] ?? bill.source, provenance: 'estime', editable: false })

  return {
    id: bill.id,
    period: bill.month,
    status: bill.is_forecast && bill.actual_amount_xof === null ? 'en_cours' : 'traitee',
    fields,
    hasPhoto: bill.has_photo,
    validationLabel: bill.is_forecast ? null : VALIDATION_LABEL[bill.validation_status ?? 'en_attente'],
    // Une facture validée sert de base aux relevés : elle n'est plus modifiable (le serveur refuse aussi).
    locked: bill.validation_status === 'validee',
    raw: { month: bill.month, amountXof: bill.amount_xof, kwhConsumed: bill.kwh_consumed },
    isForecast: bill.is_forecast,
  }
}

export async function fetchInvoices(_profile: Profile): Promise<InvoiceRecord[]> {
  const bills = await rawBills()
  return bills.map(toInvoiceRecord)
}

export async function addManualInvoice(payload: { month: string; amountXof: number; kwhConsumed?: number; periodMonths?: number }): Promise<InvoiceRecord> {
  const bill = await rawAddManualBill({ month: payload.month, amount_xof: payload.amountXof, kwh_consumed: payload.kwhConsumed, period_months: payload.periodMonths ?? 1 })
  return toInvoiceRecord(bill)
}

export async function attachInvoicePhoto(billId: string, file: File): Promise<InvoiceRecord> {
  return toInvoiceRecord(await rawAttachBillPhoto(billId, file))
}

export async function generateForecastInvoice(): Promise<InvoiceRecord> {
  const bill = await rawBillForecast()
  return toInvoiceRecord(bill)
}

export async function confirmInvoiceActual(billId: string, actualAmountXof: number): Promise<InvoiceRecord> {
  const bill = await rawConfirmBillActual(billId, actualAmountXof)
  return toInvoiceRecord(bill)
}

export async function updateInvoice(billId: string, payload: { month?: string; amountXof?: number; kwhConsumed?: number }): Promise<InvoiceRecord> {
  const bill = await rawUpdateBill(billId, { month: payload.month, amount_xof: payload.amountXof, kwh_consumed: payload.kwhConsumed })
  return toInvoiceRecord(bill)
}

export function deleteInvoice(billId: string) {
  return rawDeleteBill(billId)
}

export async function uploadInvoicePhoto(file: File): Promise<InvoiceRecord> {
  const { bill } = await rawUploadBillPhoto(file)
  return toInvoiceRecord(bill)
}

export async function fetchInvoicePhoto(billId: string): Promise<string> {
  const { photo_data_url } = await rawBillPhoto(billId)
  return photo_data_url
}
