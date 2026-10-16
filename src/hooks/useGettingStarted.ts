import { useQuery } from '@tanstack/react-query'

import { fetchBoitierRows } from '@/api/boitiers'
import { fetchInvoices } from '@/api/invoices'
import { getCachedMachines, rawSites } from '@/api/rawBackend'
import { fetchTeamMembers } from '@/api/team'
import { useAuthMe } from '@/hooks/queries/useAuthMe'
import { startProgress, type StartProgress } from '@/lib/gettingStarted'
import { isRouteAllowed } from '@/lib/navConfig'
import { useVisitedSteps } from '@/store/gettingStartedStore'
import type { Session } from '@/types/domain'

/**
 * Avancement des premiers pas, calculé sur les vraies données du compte (aucune case cochée
 * d'office). Mêmes clés de cache que les pages : rien n'est demandé deux fois, et une requête
 * n'est lancée que si le profil a accès à la page correspondante.
 */
export function useGettingStarted(session: Session): StartProgress & { isLoading: boolean } {
  const { profile } = session
  const isClient = profile !== 'admin' && profile !== 'technicien'
  const hasSites = profile === 'pme' || profile === 'industrie'
  const me = useAuthMe()
  const machines = useQuery({ queryKey: ['machines-raw'], queryFn: getCachedMachines, enabled: isClient })
  const invoices = useQuery({ queryKey: ['invoices', profile], queryFn: () => fetchInvoices(profile), enabled: isClient })
  const sites = useQuery({ queryKey: ['sites'], queryFn: rawSites, enabled: hasSites })
  const team = useQuery({ queryKey: ['team-members'], queryFn: fetchTeamMembers, enabled: hasSites && session.isTeamOwner })
  const boitiers = useQuery({ queryKey: ['boitiers'], queryFn: fetchBoitierRows, enabled: isClient && isRouteAllowed('/app/boitier', profile) })
  const visited = useVisitedSteps(session.userId)

  const progress = startProgress(
    profile,
    {
      emailConfirme: Boolean(me.data?.email_verified),
      appareils: machines.data?.length ?? 0,
      // Une prévision calculée par la plateforme n'est pas une facture envoyée.
      factures: invoices.data?.filter((invoice) => !invoice.isForecast).length ?? 0,
      sites: sites.data?.length ?? 0,
      membres: team.data?.length ?? 0,
      boitiers: boitiers.data?.length ?? 0,
    },
    visited,
  )
  return { ...progress, isLoading: me.isLoading || (isClient && machines.isLoading) }
}
