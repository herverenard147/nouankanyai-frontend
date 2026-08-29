import { rawAddManualBill, rawBillForecast, rawBills, rawConfirmBillActual } from '@/api/rawBackend'
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
  fields.push({ key: 'source', label: 'Source', value: SOURCE_LABEL[bill.source] ?? bill.source, provenance: 'estime', editable: false })

  return {
    id: bill.id,
    period: bill.month,
    status: bill.is_forecast && bill.actual_amount_xof === null ? 'en_cours' : 'traitee',
    fields,
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

/**
 * L'upload de facture par photo (OCR Gemini) sera remplacé par le pipeline
 * ReceiptFlow, pas encore branché ici. En attendant, l'action "ajouter" génère
 * une vraie prévision statistique côté backend plutôt qu'un flux d'upload
 * factice.
 */
export async function generateForecastInvoice(): Promise<InvoiceRecord> {
  const bill = await rawBillForecast()
  return toInvoiceRecord(bill)
}

export async function confirmInvoiceActual(billId: string, actualAmountXof: number): Promise<InvoiceRecord> {
  const bill = await rawConfirmBillActual(billId, actualAmountXof)
  return toInvoiceRecord(bill)
}
