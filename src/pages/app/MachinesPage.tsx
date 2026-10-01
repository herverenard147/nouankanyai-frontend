import { useState } from 'react'

import { MachineFormDrawer } from '@/components/machines/MachineFormDrawer'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowActions } from '@/components/table/RowActions'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/Modal'
import { useMachinesTable } from '@/hooks/queries/useMachinesTable'
import { useDeleteMachine } from '@/hooks/queries/useMachineCrud'
import { useRawMachines } from '@/hooks/queries/useRawMachines'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import type { BackendMachine } from '@/types/backend'
import type { MachineRow } from '@/types/domain'

// Mêmes paliers que dans IndustrieOverview — voir lib/overviewLevels.ts.
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
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BackendMachine | null>(null)
  const [deleting, setDeleting] = useState<BackendMachine | null>(null)
  const level = useLevel('industrie')
  const columns = levelAtLeast(level, 'technique') ? COLUMNS_FULL : COLUMNS_BASE

  const rawOf = (id: string) => rawQuery.data?.find((m) => m.machine_id === id) ?? null

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Machines suivies'}</h1>
        <Button type="button" onClick={() => setAdding(true)}>
          Ajouter une machine
        </Button>
      </div>
      <p className="text-sm text-text-secondary">{levelAtLeast(level, 'technique')
          ? 'Ce qui se passe sur chaque appareil : température, vibration et pression relevées, comparées à vos seuils d’alerte. Un appareil qui dépasse un seuil passe en « Anomalie détectée » et apparaît dans Alertes.'
          : 'Les appareils de votre site, leur état et leur priorité d’intervention.'}</p>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && (
          <DataTable
            columns={columns}
            rows={query.data.rows}
            onRowClick={setSelected}
            renderActions={(row) => {
              const raw = rawOf(row.id)
              return raw ? <RowActions label={raw.nom} onEdit={() => setEditing(raw)} onDelete={() => setDeleting(raw)} /> : null
            }}
          />
        )}
      </MetricState>
      <RowDetailDrawer row={selected} columns={columns} title={selected?.machine ?? ''} onClose={() => setSelected(null)} />
      {adding && <MachineFormDrawer machine={null} itemLabel="une machine" onClose={() => setAdding(false)} />}
      {editing && <MachineFormDrawer machine={editing} itemLabel="la machine" onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDeleteModal
          title={`Supprimer « ${deleting.nom} » ?`}
          consequences={[
            'Ses relevés et son historique d’alertes sont supprimés.',
            'Les prédictions et le plan d’action ne tiendront plus compte de cet appareil.',
            'Les factures déjà saisies ne changent pas.',
          ]}
          confirmText={deleting.nom}
          pending={deleteMutation.isPending}
          error={deleteMutation.error}
          onConfirm={() => deleteMutation.mutate(deleting.machine_id, { onSuccess: () => setDeleting(null) })}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
