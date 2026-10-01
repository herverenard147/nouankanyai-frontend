import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { useAudit } from '@/hooks/queries/useAudit'
import { downloadAuditCsv } from '@/api/rawBackend'
import { auditColumns } from '@/lib/auditLevels'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

/**
 * Audit : tout ce qui a été fait sur le compte (Admin : sur toute la plateforme), du plus récent au plus ancien.
 * Les colonnes dépendent du niveau (lib/auditLevels.ts) ; l'export CSV est réservé au niveau technique.
 * La piste est écrite par le backend et n'est jamais modifiable.
 */
export function AuditPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const query = useAudit(profile ?? 'menage', category)

  if (!profile) return null
  const columns = auditColumns(level, profile === 'admin')
  const data = query.data
  const totalAll = data ? data.categories.reduce((sum, c) => sum + c.count, 0) : 0

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      await downloadAuditCsv()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export impossible.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        {profile === 'admin'
          ? 'Tout ce qui a été fait sur la plateforme, par qui et quand.'
          : 'Tout ce qui a été fait sur votre compte, dans l’ordre : qui, quoi, quand.'}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par famille">
          <Pill active={category === undefined} onClick={() => setCategory(undefined)}>
            Tous {totalAll}
          </Pill>
          {data?.categories.map((c) => (
            <Pill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label} {c.count}
            </Pill>
          ))}
        </div>
        {columns.includes('source') && (
          <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? 'Export…' : 'Exporter en CSV'}
          </Button>
        )}
      </div>
      {exportError && <p className="text-sm text-alert">{exportError}</p>}

      <MetricState status={query.status} isEmpty={data?.events.length === 0}>
        {data && (
          <>
            <div className="overflow-x-auto border-t-2 border-text-primary">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    {columns.map((column) => (
                      <th key={column} scope="col" className="py-2 pr-4">
                        {COLUMN_LABEL[column]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((event) => (
                    <tr key={event.id} className="border-b border-border align-top">
                      {columns.map((column) => (
                        <td key={column} className={column === 'time' ? 'whitespace-nowrap py-2.5 pr-4 font-semibold tabular-nums' : 'py-2.5 pr-4'}>
                          {cell(column, event)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-secondary">
              {data.events.length} événement{data.events.length > 1 ? 's' : ''} affiché{data.events.length > 1 ? 's' : ''} sur {data.total} · du plus récent au plus
              ancien · enregistrés par la plateforme, jamais modifiables · heures en UTC · source : télémétrie système
            </p>
          </>
        )}
      </MetricState>
    </div>
  )
}

const COLUMN_LABEL = { time: 'Heure', account: 'Compte', actor: 'Acteur', action: 'Action', detail: 'Détail', source: 'Source' } as const

function cell(column: keyof typeof COLUMN_LABEL, event: import('@/types/domain').AuditEvent): string {
  switch (column) {
    case 'time':
      return event.time
    case 'account':
      return event.account ?? '—'
    case 'actor':
      return event.actor
    case 'action':
      return event.action
    case 'detail':
      return event.detail
    case 'source':
      return event.categoryLabel
  }
}
