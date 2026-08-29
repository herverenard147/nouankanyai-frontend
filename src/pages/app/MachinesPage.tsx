import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { useMachinesTable } from '@/hooks/queries/useMachinesTable'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import type { MachineRow } from '@/types/domain'

// Mêmes paliers que dans IndustrieOverview — voir le commentaire là-bas.
const COLUMNS_BASE: TableColumn<MachineRow>[] = [
  { key: 'machine', label: 'Machine' },
  { key: 'statut', label: 'Statut' },
  { key: 'priorite', label: 'Priorité' },
]
const COLUMNS_FULL: TableColumn<MachineRow>[] = [
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
  const level = useLevel('industrie')
  const columns = levelAtLeast(level, 'technique') ? COLUMNS_FULL : COLUMNS_BASE

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Métadonnées machine'}</h1>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && <DataTable columns={columns} rows={query.data.rows} onRowClick={setSelected} />}
      </MetricState>
      <RowDetailDrawer row={selected} columns={columns} title={selected?.machine ?? ''} onClose={() => setSelected(null)} />
    </div>
  )
}
