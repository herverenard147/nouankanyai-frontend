import { Link } from 'react-router-dom'

import { AdviceList } from '@/components/advice/AdviceList'
import { AlertSection } from '@/components/alerts/AlertSection'
import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { KpiGrid } from '@/components/kpi/KpiGrid'
import { TariffSection } from '@/components/tariff/TariffSection'
import { MetricState } from '@/components/state/MetricState'
import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { useEquipmentTable } from '@/hooks/queries/useEquipmentTable'
import { levelAtLeast } from '@/lib/levelGating'
import { useLevel } from '@/store/levelStore'
import type { EquipmentRow } from '@/types/domain'

// Au niveau "débutant" : l'essentiel (quoi, où, état). Marque/modèle/priorité
// (détail d'inventaire, utile une fois qu'on gère plusieurs appareils) —
// dès "amateur", niveau par défaut PME (voir DEFAULT_LEVEL_BY_PROFILE).
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

export function PmeOverview() {
  const equipmentQuery = useEquipmentTable('pme')
  const level = useLevel('pme')
  const columns = levelAtLeast(level, 'amateur') ? COLUMNS_FULL : COLUMNS_BASE

  return (
    <div className="flex flex-col gap-7">
      <DemoDataBanner />
      <AlertSection profile="pme" level={level} maxActionAlerts={2} />
      <KpiGrid profile="pme" />
      <TariffSection profile="pme" />
      <PredictionPanel profile="pme" level={level} />
      <AdviceList profile="pme" level={level} maxItems={2} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-section-title font-semibold text-text-primary">{equipmentQuery.data?.title ?? 'Équipements déclarés'}</h2>
          <Link to="/app/equipements" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
            Voir tous les équipements
          </Link>
        </div>
        <MetricState status={equipmentQuery.status} isEmpty={equipmentQuery.data?.rows.length === 0}>
          {equipmentQuery.data && <DataTable columns={columns} rows={equipmentQuery.data.rows} />}
        </MetricState>
      </section>
    </div>
  )
}
