import { api, saveBlob } from '@/lib/apiClient'

/** Import de factures en lot et reprise de l'export d'un autre compte (backend : /api/v1/data). */

export interface BillImportRow {
  line: number
  month: string
  amount_xof: number
  kwh_consumed: number | null
  period_months: number
}

export interface BillImportPreview {
  rows: BillImportRow[]
  rejected: { line: number; raison: string }[]
}

export async function downloadBillTemplate(): Promise<void> {
  const { blob, filename } = await api.getBlob('/api/v1/data/bills/template.csv')
  saveBlob(blob, filename ?? 'modele-factures-nouankany.csv')
}

function fileForm(file: File, include?: string[]): FormData {
  const form = new FormData()
  form.append('file', file)
  if (include) form.append('include', include.join(','))
  return form
}

export const previewBillImport = (file: File) => api.postForm<BillImportPreview>('/api/v1/data/bills/preview', fileForm(file))

export const confirmBillImport = (rows: BillImportRow[]) => api.post<{ imported: number }>('/api/v1/data/bills/import', { rows })

export type TransferSection = 'sites' | 'appareils' | 'releves' | 'factures'

export interface TransferPreview {
  source: { type_compte: string | null; exporte_le: string | null }
  sites: { a_creer: number; deja_presents: number }
  appareils: number
  releves: number
  factures: { a_importer: number; ignorees: { mois: string | null; raison: string }[] }
  /** Raison pour laquelle la formule du compte refuse cette reprise, sinon null. */
  blocage: string | null
}

export interface TransferResult {
  sites: number
  appareils: number
  releves: number
  factures: number
  factures_ignorees: { mois: string | null; raison: string }[]
}

/** `targetUserId` : reprise faite par le support dans le compte d'un client (routes admin). */
const transferPath = (step: 'preview' | 'import', targetUserId?: string) =>
  targetUserId ? `/api/v1/data/admin/transfer/${targetUserId}/${step}` : `/api/v1/data/transfer/${step}`

export const previewTransfer = (file: File, include: TransferSection[], targetUserId?: string) =>
  api.postForm<TransferPreview>(transferPath('preview', targetUserId), fileForm(file, include))

export const confirmTransfer = (file: File, include: TransferSection[], targetUserId?: string) =>
  api.postForm<TransferResult>(transferPath('import', targetUserId), fileForm(file, include))

export interface ReadingImportPreview {
  acceptes: number
  refuses: number
  appareils: { code: string; nom: string; releves: number; du: string; au: string }[]
  /** Au plus 200 lignes refusées sont détaillées ; `refuses` donne le total. */
  rejected: { line: number; raison: string }[]
}

export async function downloadReadingTemplate(): Promise<void> {
  const { blob, filename } = await api.getBlob('/api/v1/data/readings/template.csv')
  saveBlob(blob, filename ?? 'modele-releves-nouankany.csv')
}

export const previewReadingImport = (file: File) => api.postForm<ReadingImportPreview>('/api/v1/data/readings/preview', fileForm(file))

export const confirmReadingImport = (file: File) => api.postForm<{ imported: number; refuses: number }>('/api/v1/data/readings/import', fileForm(file))
