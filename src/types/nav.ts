import type { Profile } from '@/types/domain'

export interface NavEntry {
  path: string
  label: string
  icon: string
}

export type NavByProfile = Record<Profile, NavEntry[]>

export type RouteAccess = Record<string, Profile[]>
