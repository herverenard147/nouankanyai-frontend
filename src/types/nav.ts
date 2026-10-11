import type { Profile } from '@/types/domain'

export interface NavEntry {
  path: string
  label: string
  /** Page accessible mais absente du menu : elle s'ouvre depuis l'entrée indiquée, qui reste
   * surlignée (menu resserré du Ménage, partie H2). */
  under?: string
}

export type NavByProfile = Record<Profile, NavEntry[]>

export type RouteAccess = Record<string, Profile[]>
