import { AlertsSummary } from '@/components/overview/AlertsSummary'
import { EquipmentSummary } from '@/components/overview/EquipmentSummary'
import { KpiStrip } from '@/components/overview/KpiStrip'
import { PredictionSummary } from '@/components/overview/PredictionSummary'
import { ShortcutList } from '@/components/overview/ShortcutList'
import { useShortcutCatalog } from '@/components/overview/useShortcutCatalog'
import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { kpiTargets, pmeOverviewBlocks } from '@/lib/overviewLevels'
import { useLevel } from '@/store/levelStore'

/** Vue d'ensemble PME : même gabarit que l'Industrie ; le niveau décide des colonnes et des raccourcis (lib/overviewLevels.ts). */
export function PmeOverview() {
  const level = useLevel('pme')
  const blocks = pmeOverviewBlocks(level)
  const catalog = useShortcutCatalog('pme')

  return (
    <div className="flex flex-col gap-5">
      <DemoDataBanner />
      <p className="text-sm text-text-secondary">
        Vue d&rsquo;ensemble de votre activité : consommation, prédiction et équipements déclarés sur vos sites.
      </p>

      <KpiStrip profile="pme" targets={kpiTargets('pme')} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <PredictionSummary profile="pme" />
        <AlertsSummary profile="pme" max={2} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <EquipmentSummary columns={blocks.equipmentColumns} max={5} />
        <ShortcutList items={blocks.shortcuts.map((id) => catalog[id])} />
      </div>
    </div>
  )
}
