import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { useMachinesTable } from '@/hooks/queries/useMachinesTable'
import type { MachineRow } from '@/types/domain'

const COLUMNS: TableColumn<MachineRow>[] = [
  { key: 'machine', label: 'Machine' },
  { key: 'temperature', label: 'Température' },
  { key: 'vibration', label: 'Vibration' },
  { key: 'pression', label: 'Pression' },
  { key: 'statut', label: 'Statut' },
  { key: 'priorite', label: 'Priorité' },
]

export function MachinesPage() {
  const query = useMachinesTable('industrie')
  const [selected, setSelected] = useState<MachineRow | null>(null)

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Métadonnées machine'}</h1>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && <DataTable columns={COLUMNS} rows={query.data.rows} onRowClick={setSelected} />}
      </MetricState>
      <RowDetailDrawer row={selected} columns={COLUMNS} title={selected?.machine ?? ''} onClose={() => setSelected(null)} />
    </div>
  )
}
