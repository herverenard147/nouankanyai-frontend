import type { Profile } from '@/types/domain'
import type { NavByProfile, RouteAccess } from '@/types/nav'

/**
 * Source unique de vérité pour la navigation et l'accès par profil.
 * `SideRail` et `ProfileGuard` lisent tous les deux ces tables : il est
 * structurellement impossible qu'une entrée de nav pointe vers une route
 * interdite, ou l'inverse.
 *
 * `profile` est dérivé de `type_compte` côté backend (voir
 * `lib/profileMapping.ts`), pas un champ natif du backend — le backend ne
 * connaît que `type_compte` (texte libre) et `platform_role` (accès admin).
 */
export const NAV_BY_PROFILE: NavByProfile = {
  menage: [
    { path: '/app/apercu', label: "Vue d'ensemble", icon: 'V' },
    { path: '/app/alertes', label: 'Alertes', icon: 'A' },
    { path: '/app/consommation', label: 'Conso & coûts', icon: 'C' },
    { path: '/app/prediction', label: 'Prédiction', icon: 'P' },
    { path: '/app/factures', label: 'Factures', icon: 'F' },
    { path: '/app/conseils', label: 'Conseils', icon: 'I' },
    { path: '/app/recommandations', label: 'Recommandations', icon: 'O' },
    { path: '/app/parametres', label: 'Paramètres', icon: 'S' },
  ],
  pme: [
    { path: '/app/apercu', label: "Vue d'ensemble", icon: 'V' },
    { path: '/app/alertes', label: 'Alertes', icon: 'A' },
    { path: '/app/consommation', label: 'Conso & coûts', icon: 'C' },
    { path: '/app/equipements', label: 'Équipements', icon: 'E' },
    { path: '/app/prediction', label: 'Prédiction', icon: 'P' },
    { path: '/app/conseils', label: 'Conseils', icon: 'I' },
    { path: '/app/recommandations', label: 'Recommandations', icon: 'O' },
    { path: '/app/factures', label: 'Factures', icon: 'F' },
    { path: '/app/rapports', label: 'Facturation', icon: 'R' },
    { path: '/app/parametres', label: 'Paramètres', icon: 'S' },
  ],
  industrie: [
    { path: '/app/apercu', label: "Vue d'ensemble", icon: 'V' },
    { path: '/app/alertes', label: 'Alertes', icon: 'A' },
    { path: '/app/machines', label: 'Machines', icon: 'M' },
    { path: '/app/consommation', label: 'Conso & coûts', icon: 'C' },
    { path: '/app/prediction', label: 'Prédiction', icon: 'P' },
    { path: '/app/conseils', label: 'Conseils', icon: 'I' },
    { path: '/app/recommandations', label: 'Recommandations', icon: 'O' },
    { path: '/app/factures', label: 'Factures', icon: 'F' },
    { path: '/app/rapports', label: 'Facturation', icon: 'R' },
    { path: '/app/journal', label: 'Journal', icon: 'J' },
    { path: '/app/parametres', label: 'Paramètres', icon: 'S' },
  ],
  admin: [
    { path: '/app/apercu', label: "Vue d'ensemble", icon: 'V' },
    { path: '/app/alertes', label: 'Alertes', icon: 'A' },
    { path: '/app/consommation', label: 'Conso & coûts', icon: 'C' },
    { path: '/app/prediction', label: 'Prédiction', icon: 'P' },
    { path: '/app/admin/sante', label: 'Santé plateforme', icon: 'H' },
    { path: '/app/admin/modeles', label: 'Modèles & observabilité', icon: 'M' },
    { path: '/app/admin/utilisateurs', label: 'Utilisateurs', icon: 'U' },
    { path: '/app/admin/leads', label: "Demandes d'audit", icon: 'D' },
    { path: '/app/journal', label: 'Journal', icon: 'J' },
    { path: '/app/parametres', label: 'Paramètres', icon: 'S' },
  ],
}

const ALL_PROFILES: Profile[] = ['menage', 'pme', 'industrie', 'admin']

export const ROUTE_ACCESS: RouteAccess = (
  Object.entries(NAV_BY_PROFILE) as [Profile, (typeof NAV_BY_PROFILE)[Profile]][]
).reduce<RouteAccess>((acc, [profile, entries]) => {
  for (const entry of entries) {
    acc[entry.path] = acc[entry.path] ? [...acc[entry.path], profile] : [profile]
  }
  return acc
}, {})

export function isRouteAllowed(path: string, profile: Profile): boolean {
  const allowed = ROUTE_ACCESS[path]
  return allowed ? allowed.includes(profile) : ALL_PROFILES.includes(profile)
}

export function firstRouteFor(profile: Profile): string {
  return NAV_BY_PROFILE[profile][0]?.path ?? '/app/apercu'
}
