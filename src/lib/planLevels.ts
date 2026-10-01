import { levelAtLeast } from '@/lib/levelGating'
import type { Level } from '@/types/domain'

/** Ce que la page Plan d'action montre selon le niveau (DESIGN.md §4) : l'historique des résolutions dès « technique ». */
export function planBlocks(level: Level): { showResolutions: boolean } {
  return { showResolutions: levelAtLeast(level, 'technique') }
}
