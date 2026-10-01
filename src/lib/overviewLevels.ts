import type { Level } from '@/types/domain'

/**
 * Ce que chaque niveau d'affichage change sur la vue d'ensemble INDUSTRIE.
 *
 * Source unique : la page ne branche aucun `if (level …)` en dur, elle lit ce
 * tableau (testé dans src/test/overviewLevels.test.ts). Les règles reprennent
 * exactement le gating déjà en place dans l'application (voir
 * levelGating.ts : capteurs bruts, détail du modèle, plan d'action et
 * historique des résolutions = "technique" ; impacts chiffrés = "amateur").
 *
 * À faire pour les autres profils (PME, Ménage, Admin) : une fonction
 * équivalente par vue d'ensemble, selon la matrice de DESIGN.md.
 */
export type ShortcutId = 'conseils' | 'plan-action' | 'resolutions' | 'paliers'

export interface IndustrieOverviewBlocks {
  /** "full" ajoute température, vibration et pression (relevés capteur bruts). */
  machineColumns: 'base' | 'full'
  /** Ligne « modèle · jeu de données » et note du modèle sous la prédiction. */
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
