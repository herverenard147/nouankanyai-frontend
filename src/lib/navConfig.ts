import type { Profile } from '@/types/domain'
import type { NavByProfile, RouteAccess } from '@/types/nav'

/**
 * Source unique de vérité pour la navigation et l'accès par profil.
 * `SideRail` et `ProfileGuard` lisent tous les deux ces tables : il est
 * structurellement impossible qu'une entrée de nav pointe vers une route
 * interdite, ou l'inverse.
 *
 * `profile` est dérivé de `type_compte` côté backend (voir
 * `lib/profileMapping.ts`), pas un champ natif du backend : le backend ne
 * connaît que `type_compte` (texte libre) et `platform_role` (accès admin).
 */
export const NAV_BY_PROFILE: NavByProfile = {
  // Menu resserré (partie H2) : neuf entrées au vocabulaire du quotidien, plus « Documentation » (2026-10-16). Les pages marquées
  // `under` restent accessibles par leur adresse et depuis la page indiquée, sans entrée propre.
  menage: [
    { path: '/app/apercu', label: 'Accueil' },
    { path: '/app/premiers-pas', label: 'Premiers pas' },
    { path: '/app/equipements', label: 'Mes appareils' },
    { path: '/app/consommation', label: 'Ma consommation' },
    // Dans le menu (demande du propriétaire, 2026-10-21) : elle n'était qu'un lien de l'Accueil, introuvable.
    { path: '/app/prediction', label: 'Facture prévue' },
    { path: '/app/factures', label: 'Mes factures' },
    // Dans le menu principal (demande du propriétaire, 2026-10-21 : il n'était qu'un lien de la page Mes factures).
    { path: '/app/facturation', label: 'Abonnement' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/alertes', label: 'À surveiller' },
    { path: '/app/boitier', label: 'Mon boîtier' },
    { path: '/app/parametres', label: 'Paramètres' },
    // Documentation dans le menu de chaque compte (demande du propriétaire, 2026-10-16 : dixième entrée du ménage).
    { path: '/app/aide', label: 'Documentation' },
    { path: '/app/rapports', label: 'Rapports', under: '/app/factures' },
    { path: '/app/recommandations', label: 'Recommandations', under: '/app/conseils' },
  ],
  pme: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/premiers-pas', label: 'Premiers pas' },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/equipements', label: 'Équipements' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/recommandations', label: 'Recommandations' },
    { path: '/app/plan-action', label: "Plan d'action" },
    { path: '/app/factures', label: 'Factures CIE' },
    { path: '/app/facturation', label: 'Facturation Nouankany' },
    { path: '/app/rapports', label: 'Rapports' },
    { path: '/app/audit', label: 'Audit' },
    { path: '/app/sources', label: 'Sources de mesures' },
    { path: '/app/boitier', label: 'Boîtier' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
  ],
  industrie: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/premiers-pas', label: 'Premiers pas' },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/machines', label: 'Machines' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/recommandations', label: 'Recommandations' },
    { path: '/app/plan-action', label: "Plan d'action" },
    { path: '/app/factures', label: 'Factures CIE' },
    { path: '/app/facturation', label: 'Facturation Nouankany' },
    { path: '/app/rapports', label: 'Rapports' },
    { path: '/app/journal', label: 'Journal' },
    { path: '/app/audit', label: 'Audit' },
    { path: '/app/sources', label: 'Sources de mesures' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
  ],
  admin: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/premiers-pas', label: 'Premiers pas' },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/prediction', label: 'Prédiction' },
    { path: '/app/admin/sante', label: 'Santé plateforme' },
    { path: '/app/admin/modeles', label: 'Modèles & observabilité' },
    { path: '/app/admin/donnees', label: "Données d'entraînement" },
    { path: '/app/admin/utilisateurs', label: 'Utilisateurs' },
    { path: '/app/admin/leads', label: "Demandes d'audit" },
    { path: '/app/admin/messages', label: 'Messages et inscriptions' },
    { path: '/app/admin/facturation', label: 'Impayés et abonnements' },
    { path: '/app/journal', label: 'Journal' },
    { path: '/app/audit', label: 'Audit' },
    { path: '/app/admin/boitiers', label: 'Boîtiers' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
  ],
  // Personne de Nouankany qui installe chez les clients : ses interventions et sa documentation, rien d'autre.
  technicien: [
    { path: '/app/interventions', label: 'Interventions' },
    { path: '/app/aide', label: 'Documentation' },
    { path: '/app/parametres', label: 'Paramètres' },
  ],
}

/** Entrées affichées dans le menu : toutes, sauf les pages rattachées à une autre (`under`). */
export function visibleNav(profile: Profile) {
  return NAV_BY_PROFILE[profile].filter((entry) => !entry.under)
}

const ALL_PROFILES: Profile[] = ['menage', 'pme', 'industrie', 'admin', 'technicien']

export const ROUTE_ACCESS: RouteAccess = (
  Object.entries(NAV_BY_PROFILE) as [Profile, (typeof NAV_BY_PROFILE)[Profile]][]
).reduce<RouteAccess>((acc, [profile, entries]) => {
  for (const entry of entries) {
    acc[entry.path] = acc[entry.path] ? [...acc[entry.path], profile] : [profile]
  }
  return acc
}, {})

/** Une route non listée dans NAV_BY_PROFILE (ex: /app/admin/utilisateurs/:id, fiche détail
 * ouverte depuis la page Utilisateurs) hérite de l'accès de son entrée de nav parente : sans
 * ce repli, ROUTE_ACCESS ne la connaît pas du tout et isRouteAllowed l'autoriserait par
 * défaut à TOUS les profils (le repli ALL_PROFILES ci-dessous est pensé pour des routes hors
 * nav type /app/parametres, pas pour un sous-chemin d'une route déjà restreinte). */
export function isRouteAllowed(path: string, profile: Profile): boolean {
  const allowed = ROUTE_ACCESS[path] ?? Object.entries(ROUTE_ACCESS).find(([navPath]) => path.startsWith(`${navPath}/`))?.[1]
  return allowed ? allowed.includes(profile) : ALL_PROFILES.includes(profile)
}

export function firstRouteFor(profile: Profile): string {
  return NAV_BY_PROFILE[profile][0]?.path ?? '/app/apercu'
}
