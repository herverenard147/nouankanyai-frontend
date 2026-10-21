import { X } from 'lucide-react'

import { useInvoicePhoto } from '@/hooks/queries/useInvoices'
import { onEscape } from '@/lib/a11y'
import { ZoomableImage } from '@/components/ui/ZoomableImage'

interface InvoicePhotoModalProps {
  billId: string
  period: string
  onClose: () => void
}

/** Affiche la photo originale d'une facture importée par photo : récupérée à
 * la demande (voir useInvoicePhoto), pas incluse dans la liste des factures. */
export function InvoicePhotoModal({ billId, period, onClose }: InvoicePhotoModalProps) {
  const photoQuery = useInvoicePhoto(billId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/60 p-4 overlay-backdrop">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-card bg-card shadow-assistant-panel overlay-panel-center"
        role="dialog"
        aria-modal="true"
        aria-label={`Facture ${period}`}
        onKeyDown={onEscape(onClose)}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5">
          <h3 className="text-section-title font-semibold text-text-primary">Facture {period}</h3>
          <button type="button" onClick={onClose} className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary" aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div data-modal-body className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
        {photoQuery.status === 'pending' && <p className="text-sm text-text-secondary">Chargement de la photo…</p>}
        {photoQuery.status === 'error' && <p className="text-sm text-alert">Impossible de charger la photo.</p>}
        {photoQuery.status === 'success' && (
          <ZoomableImage src={photoQuery.data} alt={`Photo de la facture ${period}`} />
        )}
        </div>
      </div>
    </div>
  )
}
