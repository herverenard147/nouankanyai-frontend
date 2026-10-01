import { levelAtLeast } from '@/lib/levelGating'
import type { Level, Profile } from '@/types/domain'

/**
 * Ce que la page Boîtier montre selon le niveau (DESIGN.md §4 et §11). Le ménage n'a qu'un niveau (débutant) et voit
 * la liste de ses appareils ; la PME débutante ne voit que la lumière et l'historique.
 */
export function boitierListColumns(level: Level): {
  site: boolean
  lastActivity: boolean
  language: boolean
  id: boolean
} {
  const amateur = levelAtLeast(level, 'amateur')
  const technique = levelAtLeast(level, 'technique')
  return {
    site: amateur,
    lastActivity: amateur,
    language: technique,
    id: technique,
  }
}

export interface BoitierDetailBlocks {
  machines: boolean
  chooseMachines: boolean
  scope: boolean
  technical: boolean
  auditLink: boolean
  readings: boolean
}

export function boitierDetailBlocks(profile: Profile, level: Level): BoitierDetailBlocks {
  const amateur = levelAtLeast(level, 'amateur')
  const technique = levelAtLeast(level, 'technique')
  return {
    machines: profile === 'menage' || amateur,
    chooseMachines: amateur,
    scope: amateur && profile !== 'menage',
    technical: technique,
    auditLink: amateur,
    readings: technique,
  }
}
