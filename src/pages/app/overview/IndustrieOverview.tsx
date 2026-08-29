import { Link } from 'react-router-dom'

import { AdviceList } from '@/components/advice/AdviceList'
import { AlertSection } from '@/components/alerts/AlertSection'
import { ResolutionsList } from '@/components/anomalies/ResolutionsList'
import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { ActionPlanList } from '@/components/plan/ActionPlanList'
import { TariffSection } from '@/components/tariff/TariffSection'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
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

export function IndustrieOverview() {
  const machinesQuery = useMachinesTable('industrie')

  return (
    <div className="flex flex-col gap-7">
      <AlertSection profile="industrie" />
      <KpiGrid profile="industrie" />
      <TariffSection profile="industrie" />
      <PredictionPanel profile="industrie" />
      <AdviceList profile="industrie" />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-section-title font-semibold text-text-primary">{machinesQuery.data?.title ?? 'Métadonnées machine'}</h2>
          <Link to="/app/machines" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
            Voir toutes les machines
          </Link>
        </div>
        <MetricState status={machinesQuery.status} isEmpty={machinesQuery.data?.rows.length === 0}>
          {machinesQuery.data && <DataTable columns={COLUMNS} rows={machinesQuery.data.rows} />}
        </MetricState>
      </section>

      <ActionPlanList profile="industrie" />
      <ResolutionsList profile="industrie" />
    </div>
  )
}
