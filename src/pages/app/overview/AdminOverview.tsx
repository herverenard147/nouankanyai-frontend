import { AlertsSummary } from '@/components/overview/AlertsSummary'
import { KpiStrip } from '@/components/overview/KpiStrip'
import { PredictionSummary } from '@/components/overview/PredictionSummary'
import { ShortcutList } from '@/components/overview/ShortcutList'
import { useShortcutCatalog } from '@/components/overview/useShortcutCatalog'
import { adminOverviewBlocks, kpiTargets } from '@/lib/overviewLevels'
import { useLevel } from '@/store/levelStore'

/** Vue d'ensemble Admin : télémétrie de la plateforme, alertes tous profils, outils d'administration en raccourcis. */
export function AdminOverview() {
  const level = useLevel('admin')
  const blocks = adminOverviewBlocks(level)
  const catalog = useShortcutCatalog('admin')

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-text-secondary">
        Vue d&rsquo;ensemble de la plateforme : alertes tous profils confondus et accès rapide aux outils
        d&rsquo;administration.
      </p>

      <KpiStrip profile="admin" targets={kpiTargets('admin')} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <PredictionSummary profile="admin" showModelName={blocks.showModelName} />
        <AlertsSummary profile="admin" max={2} />
      </div>

      <ShortcutList items={blocks.shortcuts.map((id) => catalog[id])} />
    </div>
  )
}
