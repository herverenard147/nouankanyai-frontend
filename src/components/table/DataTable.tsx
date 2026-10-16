import { ImageOff } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Provenance } from '@/types/domain'

export interface TableColumn<T> {
  key: keyof T
  label: string
}

interface DataTableProps<T extends { id: string; provenance: Provenance; photo_data_url?: string | null }> {
  columns: TableColumn<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  searchPlaceholder?: string
  /** Colonne d'actions en fin de ligne (Modifier / Supprimer) ; un clic dessus n'ouvre pas la fiche détail. */
  renderActions?: (row: T) => ReactNode
  /** Ajoute une vignette (`row.photo_data_url`) en première colonne : seulement pour les tables de machines/équipements. */
  photoColumn?: boolean
}

export function DataTable<T extends { id: string; provenance: Provenance; photo_data_url?: string | null }>({
  columns,
  rows,
  onRowClick,
  searchPlaceholder = 'Rechercher…',
  renderActions,
  photoColumn = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  // Sur téléphone, une fiche par ligne plutôt qu'un tableau qui défile de côté et cache ses dernières colonnes.
  const asCards = useMediaQuery('(max-width: 639px)')

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
      {asCards ? (
        <ul className="flex flex-col border-y border-border">
          {filtered.map((row) => {
            const [first, ...rest] = columns
            return (
              <li
                key={row.id}
                className={`flex gap-3 border-t border-border py-3 first:border-t-0 ${onRowClick ? 'cursor-pointer hover:bg-bg-elevated' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {photoColumn &&
                  (row.photo_data_url ? (
                    <img src={row.photo_data_url} alt="" className="h-12 w-12 shrink-0 rounded-control object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-bg-elevated text-text-tertiary">
                      <ImageOff className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ))}
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    {first && <p className="font-semibold text-text-primary">{String(row[first.key])}</p>}
                    <ProvenanceBadge value={row.provenance} />
                  </div>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                    {rest.map((col) => (
                      <div key={String(col.key)} className="contents">
                        <dt className="text-text-tertiary">{col.label}</dt>
                        <dd className="min-w-0 break-words text-text-secondary">{String(row[col.key])}</dd>
                      </div>
                    ))}
                  </dl>
                  {renderActions && (
                    <div className="pt-1" onClick={(event) => event.stopPropagation()}>
                      {renderActions(row)}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
          {filtered.length === 0 && <li className="py-6 text-center text-text-secondary">Aucun résultat.</li>}
        </ul>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                {photoColumn && (
                  <th scope="col" className="px-4 py-3 text-left font-mono text-mono-axis font-semibold uppercase tracking-wide text-text-secondary">
                    <span className="sr-only">Photo</span>
                  </th>
                )}
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
                {renderActions && <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className={`border-t border-border ${onRowClick ? 'cursor-pointer hover:bg-bg-elevated' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {photoColumn && (
                    <td className="px-4 py-3">
                      {row.photo_data_url ? (
                        <img src={row.photo_data_url} alt="" className="h-10 w-10 rounded-control object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-control bg-bg-elevated text-text-tertiary">
                          <ImageOff className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  )}
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
                  <td colSpan={columns.length + (renderActions ? 2 : 1) + (photoColumn ? 1 : 0)} className="px-4 py-6 text-center text-text-secondary">
                    Aucun résultat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
