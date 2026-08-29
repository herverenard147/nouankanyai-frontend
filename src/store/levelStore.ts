import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Level, Profile } from '@/types/domain'

const DEFAULT_LEVEL_BY_PROFILE: Record<Profile, Level> = {
  menage: 'debutant',
  pme: 'amateur',
  industrie: 'technique',
  admin: 'technique',
}

interface LevelState {
  levelByProfile: Partial<Record<Profile, Level>>
  getLevel: (profile: Profile) => Level
  setLevel: (profile: Profile, level: Level) => void
}

/**
 * Le niveau d'affichage (débutant/amateur/technique) est une préférence
 * purement locale : le backend n'a pas ce concept, pas besoin de le persister
 * côté serveur pour qu'il reste utile (il ne pilote que la densité d'info
 * affichée sur cet appareil).
 */
export const useLevelStore = create<LevelState>()(
  persist(
    (set, get) => ({
      levelByProfile: {},
      getLevel: (profile) => get().levelByProfile[profile] ?? DEFAULT_LEVEL_BY_PROFILE[profile],
      setLevel: (profile, level) =>
        set((state) => ({ levelByProfile: { ...state.levelByProfile, [profile]: level } })),
    }),
    { name: 'nouankany-level' },
  ),
)
