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
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/factures', label: 'Factures' },
    { path: '/app/rapports', label: 'Commission' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/recommandations', label: 'Recommandations' },
    { path: '/app/parametres', label: 'Paramètres' },
  ],
  pme: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/equipements', label: 'Équipements' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/recommandations', label: 'Recommandations' },
    { path: '/app/plan-action', label: "Plan d'action" },
    { path: '/app/factures', label: 'Factures CIE' },
    { path: '/app/rapports', label: 'Commission' },
    { path: '/app/audit', label: 'Audit' },
    { path: '/app/parametres', label: 'Paramètres' },
  ],
  industrie: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/machines', label: 'Machines' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/recommandations', label: 'Recommandations' },
    { path: '/app/plan-action', label: "Plan d'action" },
    { path: '/app/factures', label: 'Factures CIE' },
    { path: '/app/rapports', label: 'Commission' },
    { path: '/app/journal', label: 'Journal' },
    { path: '/app/audit', label: 'Audit' },
    { path: '/app/parametres', label: 'Paramètres' },
  ],
  admin: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/admin/sante', label: 'Santé plateforme' },
    { path: '/app/admin/modeles', label: 'Modèles & observabilité' },
    { path: '/app/admin/utilisateurs', label: 'Utilisateurs' },
    { path: '/app/admin/leads', label: "Demandes d'audit" },
    { path: '/app/journal', label: 'Journal' },
    { path: '/app/audit', label: 'Audit' },
    { path: '/app/parametres', label: 'Paramètres' },
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
