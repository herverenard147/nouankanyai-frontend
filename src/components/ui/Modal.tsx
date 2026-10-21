import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { clsx } from 'clsx'

import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { ApiError } from '@/lib/apiClient'

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  title: string
  description?: string
  onClose: () => void
  children?: ReactNode
  /** Boutons du pied de modale (le bouton principal en dernier). */
  actions: ReactNode
  /** Modale destructive : filet rouge en tête. */
  danger?: boolean
  width?: 'md' | 'lg' | 'xl'
}

/**
 * Modale du dashboard (voir DESIGN.md §8) : centrée, coins droits, filet épais en tête. Focus piégé dans la
 * boîte, rendu à l'élément déclencheur à la fermeture, Échap = fermer, clic sur le fond = fermer.
 * Jamais plus haute que l'écran : en-tête et boutons restent visibles, seul le corps défile, avec sa barre de
 * défilement dans la modale (test du site, 2026-10-18 : titre et boutons hors d'écran en 1366×570).
 * Dès qu'un champ a été rempli, un clic à côté ne ferme plus rien (demande du propriétaire, 2026-10-19) : seuls le
 * ×, les boutons et Échap ferment, pour ne jamais perdre une saisie par mégarde.
 */
export function Modal({ title, description, onClose, children, actions, danger = false, width = 'md' }: ModalProps) {
  const titleId = useId()
  const boxRef = useRef<HTMLDivElement>(null)
  const edited = useRef(false)
  const markEdited = () => {
    edited.current = true
  }

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const first = boxRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-modal-close])')
    first?.focus()
    return () => previouslyFocused?.focus?.()
  }, [])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !boxRef.current) return
    const items = Array.from(boxRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const firstItem = items[0]
    const lastItem = items[items.length - 1]
    if (event.shiftKey && document.activeElement === firstItem) {
      event.preventDefault()
      lastItem.focus()
    } else if (!event.shiftKey && document.activeElement === lastItem) {
      event.preventDefault()
      firstItem.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/60 p-4 overlay-backdrop">
      <button
        type="button"
        aria-label="Fermer"
        tabIndex={-1}
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!edited.current) onClose()
        }}
      />
      <div
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        onInputCapture={markEdited}
        onChangeCapture={markEdited}
        className={clsx(
          'relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden border-t-4 bg-card shadow-assistant-panel overlay-panel-center',
          danger ? 'border-alert' : 'border-text-primary',
          width === 'xl' ? 'max-w-[min(1100px,96vw)]' : width === 'lg' ? 'max-w-[640px]' : 'max-w-[560px]',
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-7 sm:pt-7">
          <div className="min-w-0">
            <h2 id={titleId} className="text-h2-secondary font-bold text-text-primary">
              {/* Espace insécable avant « ? » et « ! » : le point d'interrogation passait seul à la ligne. */}
              {title.replace(/ ([?!:;])/g, '\u00a0$1')}
            </h2>
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          <button
            type="button"
            data-modal-close
            onClick={onClose}
            className="focus-ring -m-1 shrink-0 p-1 text-text-secondary hover:text-text-primary"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div data-modal-body className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-6 pb-4 sm:px-7">
          {children}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-border px-6 pb-6 pt-4 sm:px-7 sm:pb-7">{actions}</div>
      </div>
    </div>
  )
}

export function errorText(error: unknown): string {
  return error instanceof ApiError ? error.message : "L'opération a échoué. Réessayez."
}

export function MutationError({ error }: { error: unknown }) {
  if (!error) return null
  return <ApiErrorMessage message={errorText(error)} className="text-sm text-alert" />
}

export interface FieldChange {
  label: string
  before: string
  after: string
}

interface ConfirmEditModalProps {
  /** « Vous allez modifier … » */
  subject: string
  changes: FieldChange[]
  pending?: boolean
  error?: unknown
  onConfirm: () => void
  /** « Retour » : revient au formulaire, rien n'est enregistré. */
  onBack: () => void
}

/** Validation d'une modification : tableau avant → après des seuls champs changés (DESIGN.md §8). */
export function ConfirmEditModal({ subject, changes, pending, error, onConfirm, onBack }: ConfirmEditModalProps) {
  return (
    <Modal
      title="Confirmer la modification ?"
      description={subject}
      onClose={onBack}
      actions={
        <>
          <Button type="button" variant="outline" onClick={onBack} disabled={pending}>
            Retour
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending || changes.length === 0}>
            {pending ? 'Enregistrement…' : 'Confirmer la modification'}
          </Button>
        </>
      }
    >
      {changes.length === 0 ? (
        <p className="text-sm text-text-secondary">Aucun champ n’a changé.</p>
      ) : (
        <dl className="border-b border-border">
          {changes.map((change) => (
            <div key={change.label} className="grid grid-cols-[1fr_1.5rem_1fr] items-baseline gap-x-2 gap-y-1 border-t border-border py-2.5 text-sm sm:grid-cols-[8.5rem_1fr_1.5rem_1fr]">
              <dt className="col-span-3 text-text-secondary sm:col-span-1">{change.label}</dt>
              <dd className="break-words text-text-tertiary line-through">{change.before || '-'}</dd>
              <dd aria-hidden="true">→</dd>
              <dd className="break-words font-semibold text-text-primary">{change.after || '-'}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-xs text-text-secondary">Cette action sera enregistrée dans l’onglet Audit : qui, quand, et ce qui a changé.</p>
      <MutationError error={error} />
    </Modal>
  )
}

interface ConfirmDeleteModalProps {
  title: string
  description?: string
  consequences: string[]
  /** Si fourni, l'utilisateur doit saisir ce texte (nom de l'appareil) pour activer le bouton. */
  confirmText?: string
  /** Libellé du champ de confirmation (par défaut : le nom de l'objet). */
  confirmFieldLabel?: string
  confirmLabel?: string
  pending?: boolean
  error?: unknown
  onConfirm: () => void
  onCancel: () => void
}

/** Validation d'une suppression : conséquences listées, bouton rouge, saisie du nom pour les objets lourds. */
export function ConfirmDeleteModal({
  title,
  description = 'Cette action est définitive.',
  consequences,
  confirmText,
  confirmFieldLabel = 'Pour confirmer, saisissez le nom',
  confirmLabel = 'Supprimer définitivement',
  pending,
  error,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState('')
  const ready = !confirmText || typed.trim() === confirmText

  return (
    <Modal
      title={title}
      description={description}
      onClose={onCancel}
      danger
      actions={
        <>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
          <Button type="button" onClick={onConfirm} disabled={pending || !ready} className="bg-alert hover:bg-alert/90">
            {pending ? 'Suppression…' : confirmLabel}
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-1.5 text-sm text-text-primary">
        {consequences.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {confirmText && (
        <TextField
          label={confirmFieldLabel}
          placeholder={confirmText}
          autoComplete="off"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />
      )}
      <p className="text-xs text-text-secondary">La suppression sera enregistrée dans l’onglet Audit.</p>
      <MutationError error={error} />
    </Modal>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  id?: string
}

export function SelectField({ label, value, onChange, options, id }: SelectFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex h-full flex-col gap-1.5">
      <label htmlFor={fieldId} className="flex flex-1 items-end text-sm font-medium text-text-primary">
        {label}
      </label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="focus-ring min-h-11 rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
