import type { Level } from '@/types/domain'

/**
 * Ordre du niveau d'affichage (débutant < amateur < technique), utilisé pour
 * décider ce qu'un bloc du dashboard révèle progressivement. Un ménage est
 * toujours "debutant" (le sélecteur ne lui est pas proposé, voir TopBar) ;
 * PME/Industrie/Admin choisissent le leur (persisté par profil dans
 * levelStore). Le niveau par défaut de chaque profil (voir
 * DEFAULT_LEVEL_BY_PROFILE dans levelStore.ts) correspond déjà à ce qu'il
 * voyait avant l'introduction de ce fichier — seul le fait de baisser son
 * niveau simplifie réellement l'affichage, pas de régression pour qui n'y
 * touche jamais.
 */
const LEVEL_ORDER: Record<Level, number> = { debutant: 0, amateur: 1, technique: 2 }

export function levelAtLeast(level: Level, threshold: Level): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[threshold]
}
