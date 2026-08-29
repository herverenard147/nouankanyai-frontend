import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import { useEquipmentTable } from '@/hooks/queries/useEquipmentTable'
import type { EquipmentRow } from '@/types/domain'

const COLUMNS: TableColumn<EquipmentRow>[] = [
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

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-section-title font-semibold text-text-primary">{query.data?.title ?? 'Équipements déclarés'}</h1>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        {query.data && <DataTable columns={COLUMNS} rows={query.data.rows} onRowClick={setSelected} />}
      </MetricState>
      <RowDetailDrawer row={selected} columns={COLUMNS} title={selected?.categorie ?? ''} onClose={() => setSelected(null)} />
    </div>
  )
}
