import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import { onEscape } from '@/lib/a11y'

interface LegalModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/** Modale générique pour un document légal (CGU, confidentialité) : évite
 * d'en faire une page à part entière tout en gardant le texte complet. */
export function LegalModal({ title, onClose, children }: LegalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/60 p-4 overlay-backdrop">
      <button type="button" aria-label="Fermer" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col gap-5 overflow-y-auto rounded-card bg-card p-6 shadow-assistant-panel overlay-panel-center sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onEscape(onClose)}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-h2-secondary font-bold text-text-primary">{title}</h2>
          <button type="button" onClick={onClose} className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary" aria-label="Fermer">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">Dernière mise à jour : 2026.</p>
        <div className="flex flex-col gap-6 text-sm text-text-secondary">{children}</div>
      </div>
    </div>
  )
}
