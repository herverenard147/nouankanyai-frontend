import { AlertsSummary } from '@/components/overview/AlertsSummary'
import { KpiStrip } from '@/components/overview/KpiStrip'
import { MachinesSummary } from '@/components/overview/MachinesSummary'
import { PredictionSummary } from '@/components/overview/PredictionSummary'
import { ShortcutList, TariffMini, type Shortcut } from '@/components/overview/ShortcutList'
import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { useActionPlan } from '@/hooks/queries/useActionPlan'
import { useResolutions } from '@/hooks/queries/useAnomalies'
import { industrieOverviewBlocks, type ShortcutId } from '@/lib/overviewLevels'
import { useLevel } from '@/store/levelStore'

// Page ouverte au clic sur chaque indicateur clé.
const KPI_TARGETS: Record<string, string> = {
  'puissance-totale': '/app/machines',
  'machines-actives': '/app/machines',
  'economies-mois': '/app/rapports',
  'anomalies-actives': '/app/alertes',
}

/**
 * Vue d'ensemble INDUSTRIE : tient sur un écran (voir DESIGN.md, maquettes G1/G2). Elle ne montre que
 * l'essentiel et renvoie vers les pages de détail ; ce que chaque niveau (débutant / amateur /
 * technique) affiche est décidé dans lib/overviewLevels.ts, pas ici.
 */
export function IndustrieOverview() {
  const level = useLevel('industrie')
  const blocks = industrieOverviewBlocks(level)
  const planQuery = useActionPlan('industrie')
  const resolutionsQuery = useResolutions('industrie')

  const countLabel = (status: 'pending' | 'error' | 'success', length?: number) =>
    status === 'pending' ? '…' : status === 'error' ? 'Indisponible' : length ? String(length) : 'Aucune donnée'

  // Le plan d'action et l'historique n'ont pas (encore) de page dédiée : ils pointent vers la page la plus proche.
  const SHORTCUTS: Record<ShortcutId, Shortcut> = {
    conseils: { to: '/app/conseils', label: 'Conseils' },
    'plan-action': {
      to: '/app/recommandations',
      label: 'Plan d’action mensuel chiffré',
      status: countLabel(planQuery.status, planQuery.data?.length),
    },
    resolutions: {
      to: '/app/journal',
      label: 'Historique des résolutions',
      status: countLabel(resolutionsQuery.status, resolutionsQuery.data?.length),
    },
    paliers: { to: '/app/consommation', label: 'Paliers tarifaires CIE', status: <TariffMini /> },
  }

  return (
    <div className="flex flex-col gap-5">
      <DemoDataBanner />
      <p className="text-sm text-text-secondary">
        Vue d&rsquo;ensemble de votre site industriel : consommation, prédiction, machines suivies et plan d&rsquo;action
        en cours.
      </p>

      <KpiStrip profile="industrie" targets={KPI_TARGETS} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <PredictionSummary profile="industrie" showModelDetails={blocks.showModelDetails} />
        <AlertsSummary profile="industrie" max={2} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-9">
        <MachinesSummary columns={blocks.machineColumns} max={5} />
        <ShortcutList items={blocks.shortcuts.map((id) => SHORTCUTS[id])} />
      </div>
    </div>
  )
}
