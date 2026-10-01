import { AlertsSummary } from '@/components/overview/AlertsSummary'
import { KpiStrip } from '@/components/overview/KpiStrip'
import { MachinesSummary } from '@/components/overview/MachinesSummary'
import { PredictionSummary } from '@/components/overview/PredictionSummary'
import { ShortcutList } from '@/components/overview/ShortcutList'
import { useShortcutCatalog } from '@/components/overview/useShortcutCatalog'
import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { industrieOverviewBlocks, kpiTargets } from '@/lib/overviewLevels'
import { useLevel } from '@/store/levelStore'

/**
 * Vue d'ensemble INDUSTRIE : tient sur un écran (voir DESIGN.md, maquettes G1/G2). Elle ne montre que
 * l'essentiel et renvoie vers les pages de détail ; ce que chaque niveau (débutant / amateur /
 * technique) affiche est décidé dans lib/overviewLevels.ts, pas ici.
 */
export function IndustrieOverview() {
  const level = useLevel('industrie')
  const blocks = industrieOverviewBlocks(level)
  const catalog = useShortcutCatalog('industrie')

  return (
    <div className="flex flex-col gap-5">
      <DemoDataBanner />
      <p className="text-sm text-text-secondary">
        Vue d&rsquo;ensemble de votre site industriel : consommation, prédiction, machines suivies et plan d&rsquo;action
        en cours.
      </p>

      <KpiStrip profile="industrie" targets={kpiTargets('industrie')} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <PredictionSummary profile="industrie" />
        <AlertsSummary profile="industrie" max={2} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <MachinesSummary columns={blocks.machineColumns} max={5} />
        <ShortcutList items={blocks.shortcuts.map((id) => catalog[id])} />
      </div>
    </div>
  )
}
