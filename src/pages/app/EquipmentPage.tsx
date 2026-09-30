import { useState } from 'react'

import { MachineFormDrawer } from '@/components/machines/MachineFormDrawer'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { Button } from '@/components/ui/Button'
import { useEquipmentTable } from '@/hooks/queries/useEquipmentTable'
import { useDeleteMachine } from '@/hooks/queries/useMachineCrud'
import { useRawMachines } from '@/hooks/queries/useRawMachines'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import type { EquipmentRow } from '@/types/domain'

// Mêmes paliers que dans PmeOverview — voir le commentaire là-bas.
const COLUMNS_BASE: TableColumn<EquipmentRow>[] = [
  { key: 'categorie', label: 'Catégorie' },
  { key: 'site', label: 'Site' },
  { key: 'statut', label: 'Statut' },
]
const COLUMNS_FULL: TableColumn<EquipmentRow>[] = [
  { key: 'categorie', label: 'Catégorie' },
  { key: 'marque', label: 'Marque' },
  { key: 'modele', label: 'Modèle' },
  { key: 'site', label: 'Site' },
  { key: 'priorite', label: 'Priorité' },
  { key: 'statut', label: 'Statut' },
]

export function EquipmentPage() {
  const query = useEquipmentTable('pme')
  const rawQuery = useRawMachines()
  const deleteMutation = useDeleteMachine()
  const [selected, setSelected] = useState<EquipmentRow | null>(null)
  const [formOpen, setFormOpen] = useState<'add' | 'edit' | null>(null)
  const level = useLevel('pme')
  const columns = levelAtLeast(level, 'amateur') ? COLUMNS_FULL : COLUMNS_BASE

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
        <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Équipements déclarés'}</h1>
        <Button type="button" onClick={() => setFormOpen('add')}>
          Ajouter un équipement
        </Button>
      </div>
      <p className="text-sm text-text-secondary">
        Inventaire des équipements déclarés sur vos sites, utilisé pour estimer votre consommation en l&rsquo;absence
        de capteur.
      </p>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && <DataTable columns={columns} rows={query.data.rows} onRowClick={setSelected} />}
      </MetricState>
      <RowDetailDrawer
        row={formOpen ? null : selected}
        columns={columns}
        title={selected?.categorie ?? ''}
        onClose={() => setSelected(null)}
        onEdit={() => setFormOpen('edit')}
        onDelete={handleDelete}
        deletePending={deleteMutation.isPending}
      />
      {formOpen === 'add' && <MachineFormDrawer machine={null} itemLabel="un équipement" onClose={() => setFormOpen(null)} />}
      {formOpen === 'edit' && selectedRaw && (
        <MachineFormDrawer
          machine={selectedRaw}
          itemLabel="l’équipement"
          onClose={() => {
            setFormOpen(null)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
