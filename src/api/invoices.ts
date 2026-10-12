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

// D'où vient la facture, dit simplement : une photo lue ou une saisie ne sont pas des « estimations ».
const SOURCE_LABEL: Record<BackendElectricityBill['source'], string> = {
  manuel: 'Saisie à la main',
  ocr: 'Lue sur la photo',
  'ocr-mock': 'Lecture simulée',
  statistique: 'Calculée par le modèle',
  demo: 'Démonstration',
}

// État de vérification affiché à côté de chaque valeur d'une facture réelle.
const FIELD_STATUS_LABEL = {
  en_attente: 'À valider',
  validee: 'Vérifié',
  rejetee: 'Rejetée',
} as const

const VALIDATION_LABEL = {
  en_attente: 'En attente de validation',
  validee: 'Validée, base des relevés',
  rejetee: 'Rejetée',
} as const

function toInvoiceRecord(bill: BackendElectricityBill): InvoiceRecord {
  // Une prévision garde son badge de provenance (synthétique) ; une facture réelle porte son état de vérification.
  const statusLabel = bill.is_forecast ? undefined : FIELD_STATUS_LABEL[bill.validation_status ?? 'en_attente']
  const rawFields: OcrField[] = [
    { key: 'periode', label: 'Période facturée', value: bill.month, provenance: 'estime', editable: false },
    {
      key: 'montant',
      label: bill.is_forecast ? 'Montant prévu' : 'Montant TTC',
      value: bill.amount ?? '-',
      provenance: bill.is_forecast ? 'synthetique' : 'estime',
      editable: false,
    },
  ]
  if (bill.kwh_consumed !== null) {
    rawFields.push({ key: 'kwh', label: 'Consommation', value: `${formatNumberFr(bill.kwh_consumed)}${NARROW_NBSP}kWh`, provenance: 'estime', editable: false })
  }
  if (bill.actual_amount_xof !== null) {
    rawFields.push({
      key: 'reel',
      label: 'Montant réel confirmé',
      value: formatFcfa(bill.actual_amount_xof),
      provenance: 'estime',
      editable: false,
    })
  }
  // Détail NouankanyAI (extraction par photo uniquement, voir document_type sur
  // BackendElectricityBill) : le type de document et, pour un paiement numérique,
  // l'opérateur et la référence de transaction : jamais affichés pour une saisie
  // manuelle ou une prévision, où ces champs sont toujours null côté backend.
  if (bill.document_type === 'recu_paiement_numerique') {
    rawFields.push({ key: 'type_document', label: 'Type de document', value: 'Reçu de paiement numérique', provenance: 'estime', editable: false })
    if (bill.payment_operator) {
      rawFields.push({ key: 'operateur', label: 'Opérateur de paiement', value: bill.payment_operator, provenance: 'estime', editable: false })
    }
  } else if (bill.document_type === 'facture_papier') {
    rawFields.push({ key: 'type_document', label: 'Type de document', value: 'Facture CIE papier', provenance: 'estime', editable: false })
  }
  if ((bill.period_months ?? 1) > 1) {
    rawFields.push({ key: 'duree', label: 'Durée couverte', value: `${bill.period_months} mois (bimestrielle)`, provenance: 'estime', editable: false })
  }
  if (bill.payment_reference) {
    rawFields.push({ key: 'reference', label: 'Référence', value: bill.payment_reference, provenance: 'estime', editable: false })
  }
  // La ligne « Source » dit elle-même d'où vient la facture : pas de badge en plus.
  const fields: OcrField[] = [
    ...rawFields.map((field) => (statusLabel && field.provenance === 'estime' ? { ...field, statusLabel } : field)),
    { key: 'source', label: 'Source', value: SOURCE_LABEL[bill.source] ?? bill.source, provenance: 'estime', statusLabel: '', editable: false },
  ]

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
