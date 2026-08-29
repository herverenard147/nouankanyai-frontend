import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { useEquipmentTable } from '@/hooks/queries/useEquipmentTable'
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
  const [selected, setSelected] = useState<EquipmentRow | null>(null)
  const level = useLevel('pme')
  const columns = levelAtLeast(level, 'amateur') ? COLUMNS_FULL : COLUMNS_BASE

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Équipements déclarés'}</h1>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && <DataTable columns={columns} rows={query.data.rows} onRowClick={setSelected} />}
      </MetricState>
      <RowDetailDrawer row={selected} columns={columns} title={selected?.categorie ?? ''} onClose={() => setSelected(null)} />
    </div>
  )
}
