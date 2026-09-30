import { Link } from 'react-router-dom'

import { AdviceList } from '@/components/advice/AdviceList'
import { AlertSection } from '@/components/alerts/AlertSection'
import { ResolutionsList } from '@/components/anomalies/ResolutionsList'
import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { ActionPlanList } from '@/components/plan/ActionPlanList'
import { TariffSection } from '@/components/tariff/TariffSection'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { useMachinesTable } from '@/hooks/queries/useMachinesTable'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import type { MachineRow } from '@/types/domain'

// Température/vibration/pression sont des relevés capteur bruts — réservés
// au niveau "technique", niveau par défaut Industrie (voir
// DEFAULT_LEVEL_BY_PROFILE) : aucun changement pour qui n'y touche pas.
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

export function IndustrieOverview() {
  const machinesQuery = useMachinesTable('industrie')
  const level = useLevel('industrie')
  const columns = levelAtLeast(level, 'technique') ? COLUMNS_FULL : COLUMNS_BASE

  return (
    <div className="flex flex-col gap-7">
      <DemoDataBanner />
      <p className="text-sm text-text-secondary">
        Vue d&rsquo;ensemble de votre site industriel : consommation, prédiction, machines suivies et plan d&rsquo;action
        en cours.
      </p>
      <AlertSection profile="industrie" level={level} maxActionAlerts={2} />
      <KpiGrid profile="industrie" />
      <TariffSection profile="industrie" />
      <PredictionPanel profile="industrie" level={level} />
      <AdviceList profile="industrie" level={level} maxItems={2} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-section-title font-semibold text-text-primary">{machinesQuery.data?.title ?? 'Métadonnées machine'}</h2>
          <Link to="/app/machines" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
            Voir toutes les machines
          </Link>
        </div>
        <MetricState status={machinesQuery.status} isEmpty={machinesQuery.data?.rows.length === 0}>
          {machinesQuery.data && <DataTable columns={columns} rows={machinesQuery.data.rows} />}
        </MetricState>
      </section>

      <ActionPlanList profile="industrie" level={level} />
      <ResolutionsList profile="industrie" level={level} />
    </div>
  )
}
