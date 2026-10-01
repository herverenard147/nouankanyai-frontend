import { levelAtLeast } from '@/lib/levelGating'
import type { Level } from '@/types/domain'

export type AuditColumn = 'time' | 'account' | 'actor' | 'action' | 'detail' | 'source'

/**
 * Colonnes de l'Audit selon le niveau (DESIGN.md §4) : débutant = Heure, Action, Détail ; amateur = + Acteur ;
 * technique = + Source (et export CSV). L'Admin voit en plus le compte concerné.
 */
export function auditColumns(level: Level, isAdmin: boolean): AuditColumn[] {
  return [
    'time',
    ...(isAdmin ? (['account'] as const) : []),
    ...(levelAtLeast(level, 'amateur') ? (['actor'] as const) : []),
    'action',
    'detail',
    ...(levelAtLeast(level, 'technique') ? (['source'] as const) : []),
  ]
}
