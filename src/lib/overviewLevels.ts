import type { Level, Profile } from '@/types/domain'

/**
 * Ce que chaque niveau d'affichage change sur la vue d'ensemble, par profil (matrice de DESIGN.md §4).
 *
 * Source unique : les pages ne branchent aucun `if (level …)` en dur, elles lisent ces fonctions (testées dans
 * src/test/overviewLevels.test.ts). Les règles reprennent le gating déjà en place dans l'application
 * (levelGating.ts : relevés bruts, plan d'action et historique des résolutions = « technique » ; marque / modèle /
 * priorité d'inventaire = « amateur »).
 */
export type ShortcutId =
  | 'conseils'
  | 'recommandations'
  | 'plan-action'
  | 'resolutions'
  | 'paliers'
  | 'commission'
  | 'factures'
  | 'sante'
  | 'modeles'
  | 'utilisateurs'
  | 'journal'
  | 'audit'

export interface IndustrieOverviewBlocks {
  /** "full" ajoute température, vibration et pression (relevés des appareils). */
  machineColumns: 'base' | 'full'
  /** Ne pilote plus que la phrase qui explique la page Prédiction (plus de ligne « modèle · jeu de données »). */
  showModelDetails: boolean
  shortcuts: ShortcutId[]
}

export function industrieOverviewBlocks(level: Level): IndustrieOverviewBlocks {
  if (level === 'technique') {
    return { machineColumns: 'full', showModelDetails: true, shortcuts: ['plan-action', 'resolutions', 'paliers'] }
  }
  // Débutant et amateur : pas de plan d'action chiffré ni d'historique (réservés au technique) ;
  // les conseils prennent leur place dans les raccourcis.
  return { machineColumns: 'base', showModelDetails: false, shortcuts: ['conseils', 'paliers'] }
}

export interface PmeOverviewBlocks {
  /** "base" : Catégorie, Site, Statut ; "full" : + Marque, Modèle, Priorité (dès « amateur »). */
  equipmentColumns: 'base' | 'full'
  shortcuts: ShortcutId[]
}

export function pmeOverviewBlocks(level: Level): PmeOverviewBlocks {
  const base: ShortcutId[] = ['conseils', 'recommandations', 'factures', 'paliers']
  if (level === 'technique') return { equipmentColumns: 'full', shortcuts: ['plan-action', ...base] }
  return { equipmentColumns: level === 'amateur' ? 'full' : 'base', shortcuts: base }
}

export interface MenageOverviewBlocks {
  shortcuts: ShortcutId[]
}

/** Ménage : un seul niveau (débutant, aucun sélecteur). Il paie selon ses économies : la commission est un raccourci. */
export function menageOverviewBlocks(): MenageOverviewBlocks {
  return { shortcuts: ['conseils', 'recommandations', 'commission', 'paliers'] }
}

export interface AdminOverviewBlocks {
  /** Nom du modèle et jeu de données sous la prédiction : réservé à l'Admin, niveau technique. */
  showModelName: boolean
  shortcuts: ShortcutId[]
}

export function adminOverviewBlocks(level: Level): AdminOverviewBlocks {
  return { showModelName: level === 'technique', shortcuts: ['sante', 'modeles', 'utilisateurs', 'journal', 'audit'] }
}

/** Page ouverte au clic sur chaque indicateur clé, par profil. */
export function kpiTargets(profile: Profile): Record<string, string> {
  switch (profile) {
    case 'industrie':
      return { 'puissance-totale': '/app/machines', 'machines-actives': '/app/machines', 'economies-mois': '/app/rapports', 'anomalies-actives': '/app/alertes' }
    case 'pme':
      return { 'puissance-totale': '/app/equipements', 'machines-actives': '/app/equipements', 'economies-mois': '/app/rapports', 'anomalies-actives': '/app/alertes' }
    case 'menage':
      return { 'puissance-totale': '/app/consommation', 'machines-actives': '/app/alertes', 'economies-mois': '/app/rapports', 'anomalies-actives': '/app/alertes' }
    case 'admin':
      return { 'base-donnees': '/app/admin/sante', uptime: '/app/admin/sante', 'latence-moyenne': '/app/admin/sante', 'machines-plateforme': '/app/admin/sante' }
  }
}
