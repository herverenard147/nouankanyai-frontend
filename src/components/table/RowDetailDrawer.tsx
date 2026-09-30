import { X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { onEscape } from '@/lib/a11y'
import type { Provenance } from '@/types/domain'
import type { TableColumn } from '@/components/table/DataTable'

interface RowDetailDrawerProps<T extends { id: string; provenance: Provenance }> {
  row: T | null
  columns: TableColumn<T>[]
  title: string
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  deletePending?: boolean
}

/** Fiche détail d'une ligne de table (équipement, machine), ouverte au clic sur la ligne. */
export function RowDetailDrawer<T extends { id: string; provenance: Provenance }>({
  row,
  columns,
  title,
  onClose,
  onEdit,
  onDelete,
  deletePending,
}: RowDetailDrawerProps<T>) {
  if (!row) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-dark-bg/40 overlay-backdrop">
      <button
        type="button"
        aria-label="Fermer la fiche détail"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-sm flex-col gap-4 overflow-y-auto bg-card p-6 shadow-assistant-panel overlay-panel-right"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onEscape(onClose)}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-section-title font-semibold text-text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="focus-ring rounded-control p-1 text-text-secondary hover:text-text-primary" aria-label="Fermer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <dl className="flex flex-col gap-3 text-sm">
          {columns.map((col) => (
            <div key={String(col.key)} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
              <dt className="text-text-secondary">{col.label}</dt>
              <dd className="min-w-0 break-words font-mono text-text-primary">{String(row[col.key])}</dd>
            </div>
          ))}
        </dl>
        <ProvenanceBadge value={row.provenance} className="w-fit" />
        {(onEdit || onDelete) && (
          <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
            {onEdit && (
              <Button type="button" variant="ghost" onClick={onEdit}>
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button type="button" variant="ghost" disabled={deletePending} onClick={onDelete} className="text-alert">
                {deletePending ? 'Suppression…' : 'Supprimer'}
              </Button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
