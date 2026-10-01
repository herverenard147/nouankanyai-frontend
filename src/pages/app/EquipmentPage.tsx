import { useState } from 'react'

import { MachineFormDrawer } from '@/components/machines/MachineFormDrawer'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowActions } from '@/components/table/RowActions'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { Button } from '@/components/ui/Button'
import { ConfirmDeleteModal } from '@/components/ui/Modal'
import { useEquipmentTable } from '@/hooks/queries/useEquipmentTable'
import { useDeleteMachine } from '@/hooks/queries/useMachineCrud'
import { useRawMachines } from '@/hooks/queries/useRawMachines'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import type { BackendMachine } from '@/types/backend'
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
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<BackendMachine | null>(null)
  const [deleting, setDeleting] = useState<BackendMachine | null>(null)
  const level = useLevel('pme')
  const columns = levelAtLeast(level, 'amateur') ? COLUMNS_FULL : COLUMNS_BASE

  const rawOf = (id: string) => rawQuery.data?.find((m) => m.machine_id === id) ?? null

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Équipements déclarés'}</h1>
        <Button type="button" onClick={() => setAdding(true)}>
          Ajouter un équipement
        </Button>
      </div>
      <p className="text-sm text-text-secondary">Inventaire des équipements déclarés sur vos sites, utilisé pour estimer votre consommation en l’absence de capteur.</p>
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
      <RowDetailDrawer row={selected} columns={columns} title={selected?.categorie ?? ''} onClose={() => setSelected(null)} />
      {adding && <MachineFormDrawer machine={null} itemLabel="un équipement" onClose={() => setAdding(false)} />}
      {editing && <MachineFormDrawer machine={editing} itemLabel="l’équipement" onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDeleteModal
          title={`Supprimer « ${deleting.nom} » ?`}
          consequences={[
            'Ses relevés et son historique d’alertes sont supprimés.',
            'Les prédictions et le plan d’action ne tiendront plus compte de cet équipement.',
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
