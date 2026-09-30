import { X } from 'lucide-react'

import { useInvoicePhoto } from '@/hooks/queries/useInvoices'
import { onEscape } from '@/lib/a11y'

interface InvoicePhotoModalProps {
  billId: string
  period: string
  onClose: () => void
}

/** Affiche la photo originale d'une facture importée par photo — récupérée à
 * la demande (voir useInvoicePhoto), pas incluse dans la liste des factures. */
export function InvoicePhotoModal({ billId, period, onClose }: InvoicePhotoModalProps) {
  const photoQuery = useInvoicePhoto(billId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/60 p-4 overlay-backdrop">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-card bg-card p-5 shadow-assistant-panel overlay-panel-center"
        role="dialog"
        aria-modal="true"
        aria-label={`Facture ${period}`}
        onKeyDown={onEscape(onClose)}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-section-title font-semibold text-text-primary">Facture {period}</h3>
          <button type="button" onClick={onClose} className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary" aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {photoQuery.status === 'pending' && <p className="text-sm text-text-secondary">Chargement de la photo…</p>}
        {photoQuery.status === 'error' && <p className="text-sm text-alert">Impossible de charger la photo.</p>}
        {photoQuery.status === 'success' && (
          <img src={photoQuery.data} alt={`Photo de la facture ${period}`} className="w-full rounded-control border border-border" />
        )}
      </div>
    </div>
  )
}
