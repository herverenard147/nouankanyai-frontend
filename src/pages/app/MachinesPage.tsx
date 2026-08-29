import { useState } from 'react'

import { MachineFormDrawer } from '@/components/machines/MachineFormDrawer'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { Button } from '@/components/ui/Button'
import { useDeleteMachine } from '@/hooks/queries/useMachineCrud'
import { useMachinesTable } from '@/hooks/queries/useMachinesTable'
import { useRawMachines } from '@/hooks/queries/useRawMachines'
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
  const rawQuery = useRawMachines()
  const deleteMutation = useDeleteMachine()
  const [selected, setSelected] = useState<MachineRow | null>(null)
  const [formOpen, setFormOpen] = useState<'add' | 'edit' | null>(null)
  const level = useLevel('industrie')
  const columns = levelAtLeast(level, 'technique') ? COLUMNS_FULL : COLUMNS_BASE

  const selectedRaw = selected ? rawQuery.data?.find((m) => m.machine_id === selected.id) ?? null : null

  function handleDelete() {
    if (!selected) return
    deleteMutation.mutate(selected.id, {
      onSuccess: () => setSelected(null),
    })
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Métadonnées machine'}</h1>
        <Button type="button" onClick={() => setFormOpen('add')}>
          Ajouter une machine
        </Button>
      </div>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && <DataTable columns={columns} rows={query.data.rows} onRowClick={setSelected} />}
      </MetricState>
      <RowDetailDrawer
        row={formOpen ? null : selected}
        columns={columns}
        title={selected?.machine ?? ''}
        onClose={() => setSelected(null)}
        onEdit={() => setFormOpen('edit')}
        onDelete={handleDelete}
        deletePending={deleteMutation.isPending}
      />
      {formOpen === 'add' && <MachineFormDrawer machine={null} itemLabel="une machine" onClose={() => setFormOpen(null)} />}
      {formOpen === 'edit' && selectedRaw && (
        <MachineFormDrawer
          machine={selectedRaw}
          itemLabel="la machine"
          onClose={() => {
            setFormOpen(null)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
