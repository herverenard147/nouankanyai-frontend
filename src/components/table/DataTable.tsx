import { useMemo, useState, type ReactNode } from 'react'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import type { Provenance } from '@/types/domain'

export interface TableColumn<T> {
  key: keyof T
  label: string
}

interface DataTableProps<T extends { id: string; provenance: Provenance }> {
  columns: TableColumn<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  /** Colonne d'actions en fin de ligne (Modifier / Supprimer) ; un clic dessus n'ouvre pas la fiche détail. */
  renderActions?: (row: T) => ReactNode
}

export function DataTable<T extends { id: string; provenance: Provenance }>({
  columns,
  rows,
  onRowClick,
  searchPlaceholder = 'Rechercher…',
  renderActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    let result = rows
    if (term) {
      result = rows.filter((row) => columns.some((col) => String(row[col.key]).toLowerCase().includes(term)))
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const cmp = String(a[sortKey]).localeCompare(String(b[sortKey]), 'fr')
        return sortAsc ? cmp : -cmp
      })
    }
    return result
  }, [rows, search, sortKey, sortAsc, columns])

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="focus-ring min-h-11 w-full max-w-xs rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
      />
      <div className="overflow-x-auto border-y border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-bg-elevated">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} scope="col" className="p-0">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="focus-ring flex w-full items-center gap-1 px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary"
                  >
                    {col.label}
                    {sortKey === col.key && <span aria-hidden="true">{sortAsc ? '↑' : '↓'}</span>}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">
                Provenance
              </th>
              {renderActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className={`border-t border-border ${onRowClick ? 'cursor-pointer hover:bg-bg-elevated' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-3 ${colIndex === 0 ? 'text-text-primary' : 'font-mono text-text-secondary'}`}
                  >
                    {String(row[col.key])}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <ProvenanceBadge value={row.provenance} />
                </td>
                {renderActions && (
                  <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    {renderActions(row)}
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + (renderActions ? 2 : 1)} className="px-4 py-6 text-center text-text-secondary">
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
