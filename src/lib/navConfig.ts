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
  // Menus resserrés (2026-11-15, audit S-14) : au plus dix entrées par profil. Les pages marquées `under` n'ont pas d'entrée propre : elles
  // s'ouvrent depuis leur page parente (rangée « Pages liées », `RelatedPages`), qui reste surlignée dans le menu ; aucune route n'est supprimée.
  // Parents revus le 2026-11-15 : Rapports sous « Ma consommation » / « Conso & coûts » (ce n'est pas une facture), Abonnement sous Paramètres (ce n'est pas une facture CIE),
  // Messages sous « Demandes d'audit » (prospects, pas comptes), Boîtiers admin sous Santé plateforme.
  // Décision du 2026-11-15 (le propriétaire : en cas de contradiction avec une ancienne décision, retenir le meilleur choix) : « Abonnement » et « Facture prévue »,
  // mis dans le menu le 2026-10-21 parce qu'ils étaient introuvables, sont rangés sous leur page parente, que la rangée « Pages liées » rend visible.
  menage: [
    { path: '/app/apercu', label: 'Accueil' },
    { path: '/app/equipements', label: 'Mes appareils' },
    { path: '/app/consommation', label: 'Ma consommation' },
    { path: '/app/factures', label: 'Mes factures' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/alertes', label: 'À surveiller' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
    { path: '/app/premiers-pas', label: 'Premiers pas', under: '/app/apercu' },
    { path: '/app/boitier', label: 'Mon boîtier (prototype)', under: '/app/equipements' },
    { path: '/app/prediction', label: 'Facture prévue', under: '/app/consommation' },
    { path: '/app/facturation', label: 'Abonnement', under: '/app/parametres' },
    { path: '/app/rapports', label: 'Rapports', under: '/app/consommation' },
    { path: '/app/recommandations', label: 'Recommandations', under: '/app/conseils' },
  ],
  pme: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/equipements', label: 'Équipements' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/factures', label: 'Factures CIE' },
    { path: '/app/sources', label: 'Sources de mesures' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
    { path: '/app/premiers-pas', label: 'Premiers pas', under: '/app/apercu' },
    { path: '/app/prediction', label: 'Prévision', under: '/app/consommation' },
    { path: '/app/recommandations', label: 'Recommandations', under: '/app/conseils' },
    { path: '/app/plan-action', label: "Plan d'action", under: '/app/conseils' },
    { path: '/app/rapports', label: 'Rapports', under: '/app/consommation' },
    { path: '/app/boitier', label: 'Boîtier (prototype)', under: '/app/sources' },
    { path: '/app/facturation', label: 'Facturation Nouankany', under: '/app/parametres' },
    { path: '/app/audit', label: 'Audit', under: '/app/parametres' },
  ],
  industrie: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/machines', label: 'Machines' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/conseils', label: 'Conseils' },
    { path: '/app/factures', label: 'Factures CIE' },
    { path: '/app/sources', label: 'Sources de mesures' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
    { path: '/app/premiers-pas', label: 'Premiers pas', under: '/app/apercu' },
    { path: '/app/prediction', label: 'Prévision', under: '/app/consommation' },
    { path: '/app/recommandations', label: 'Recommandations', under: '/app/conseils' },
    { path: '/app/plan-action', label: "Plan d'action", under: '/app/conseils' },
    { path: '/app/rapports', label: 'Rapports', under: '/app/consommation' },
    { path: '/app/facturation', label: 'Facturation Nouankany', under: '/app/parametres' },
    { path: '/app/journal', label: 'Journal', under: '/app/parametres' },
    { path: '/app/audit', label: 'Audit', under: '/app/parametres' },
  ],
  admin: [
    { path: '/app/apercu', label: "Vue d'ensemble" },
    { path: '/app/alertes', label: 'Alertes' },
    { path: '/app/consommation', label: 'Conso & coûts' },
    { path: '/app/admin/sante', label: 'Santé plateforme' },
    { path: '/app/admin/utilisateurs', label: 'Utilisateurs' },
    { path: '/app/admin/facturation', label: 'Impayés et abonnements' },
    { path: '/app/admin/leads', label: "Demandes d'audit" },
    { path: '/app/journal', label: 'Journal' },
    { path: '/app/parametres', label: 'Paramètres' },
    { path: '/app/aide', label: 'Documentation' },
    { path: '/app/premiers-pas', label: 'Premiers pas', under: '/app/apercu' },
    { path: '/app/prediction', label: 'Prévision', under: '/app/consommation' },
    { path: '/app/admin/modeles', label: 'Modèles & observabilité', under: '/app/admin/sante' },
    { path: '/app/admin/donnees', label: "Données d'entraînement", under: '/app/admin/sante' },
    { path: '/app/admin/boitiers', label: 'Boîtiers', under: '/app/admin/sante' },
    { path: '/app/admin/messages', label: 'Messages et inscriptions', under: '/app/admin/leads' },
    // Commande de matériel fermée (S-09) : pas d'entrée de menu propre ; la route reste, rangée sous Paramètres.
    { path: '/app/admin/prix-materiel', label: 'Prix du matériel', under: '/app/parametres' },
    { path: '/app/audit', label: 'Audit', under: '/app/journal' },
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

/** Action proposée par un état vide de conseils ou de résumé : aller ajouter l'appareil dont tout part. */
export function addEquipmentAction(profile: Profile): { to: string; label: string } {
  if (profile === 'industrie') return { to: '/app/machines', label: 'Ajouter une machine' }
  return { to: '/app/equipements', label: profile === 'menage' ? 'Ajouter un appareil' : 'Ajouter un équipement' }
}
