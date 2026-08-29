import {
  rawAddManualBill,
  rawBillForecast,
  rawBillPhoto,
  rawBills,
  rawConfirmBillActual,
  rawDeleteBill,
  rawUploadBillPhoto,
} from '@/api/rawBackend'
import type { BackendElectricityBill } from '@/types/backend'
import type { InvoiceRecord, OcrField, Profile } from '@/types/domain'

const SOURCE_LABEL: Record<BackendElectricityBill['source'], string> = {
  manuel: 'estimé',
  ocr: 'estimé',
  'ocr-mock': 'estimé',
  statistique: 'synthétique',
}

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
    fields.push({ key: 'kwh', label: 'Consommation', value: `${bill.kwh_consumed} kWh`, provenance: 'estime', editable: false })
  }
  if (bill.actual_amount_xof !== null) {
    fields.push({
      key: 'reel',
      label: 'Montant réel confirmé',
      value: `${bill.actual_amount_xof.toLocaleString('fr-FR')} FCFA`,
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
  }
}

export async function fetchInvoices(_profile: Profile): Promise<InvoiceRecord[]> {
  const bills = await rawBills()
  return bills.map(toInvoiceRecord)
}

export async function addManualInvoice(payload: { month: string; amountXof: number; kwhConsumed?: number }): Promise<InvoiceRecord> {
  const bill = await rawAddManualBill({ month: payload.month, amount_xof: payload.amountXof, kwh_consumed: payload.kwhConsumed })
  return toInvoiceRecord(bill)
}

export async function generateForecastInvoice(): Promise<InvoiceRecord> {
  const bill = await rawBillForecast()
  return toInvoiceRecord(bill)
}

export async function confirmInvoiceActual(billId: string, actualAmountXof: number): Promise<InvoiceRecord> {
  const bill = await rawConfirmBillActual(billId, actualAmountXof)
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
