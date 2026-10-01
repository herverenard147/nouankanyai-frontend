import { useActionPlan, usePlanSummary } from '@/hooks/queries/useActionPlan'
import { useResolutions } from '@/hooks/queries/useAnomalies'
import { TariffMini, type Shortcut } from '@/components/overview/ShortcutList'
import type { ShortcutId } from '@/lib/overviewLevels'
import type { Profile } from '@/types/domain'

function countLabel(status: 'pending' | 'error' | 'success', length?: number): string {
  if (status === 'pending') return '…'
  if (status === 'error') return 'Indisponible'
  return length ? String(length) : 'Aucune donnée'
}

/** Raccourcis de la vue d'ensemble : libellé, page ouverte et état court à droite, par identifiant. */
export function useShortcutCatalog(profile: Profile): Record<ShortcutId, Shortcut> {
  const plan = useActionPlan(profile)
  const planSummary = usePlanSummary(profile)
  const resolutions = useResolutions(profile)
  const invoicesLabel = profile === 'menage' ? 'Factures' : 'Factures CIE'

  return {
    conseils: { to: '/app/conseils', label: 'Conseils' },
    recommandations: { to: '/app/recommandations', label: 'Recommandations' },
    'plan-action': {
      to: '/app/plan-action',
      label: 'Plan d’action mensuel chiffré',
      status: planSummary.data ? `${planSummary.data.openCount} à faire` : countLabel(plan.status, plan.data?.length),
    },
    resolutions: {
      to: '/app/plan-action',
      label: 'Historique des résolutions',
      status: countLabel(resolutions.status, resolutions.data?.length),
    },
    paliers: { to: '/app/consommation', label: 'Paliers tarifaires CIE', status: <TariffMini /> },
    commission: { to: '/app/rapports', label: 'Commission' },
    factures: { to: '/app/factures', label: invoicesLabel },
    sante: { to: '/app/admin/sante', label: 'Santé plateforme' },
    modeles: { to: '/app/admin/modeles', label: 'Modèles & observabilité' },
    utilisateurs: { to: '/app/admin/utilisateurs', label: 'Utilisateurs' },
    journal: { to: '/app/journal', label: 'Journal d’activité' },
    audit: { to: '/app/audit', label: 'Audit' },
  }
}
