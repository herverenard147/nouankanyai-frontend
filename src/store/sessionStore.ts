import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { api, ApiError } from '@/lib/apiClient'
import { deriveProfile } from '@/lib/profileMapping'
import type { BackendAuthResult } from '@/types/backend'
import type { Session } from '@/types/domain'

type AuthResult = { ok: true } | { ok: false; message: string }

function toSession(result: BackendAuthResult): Session {
  return {
    userId: result.user.id,
    token: result.token,
    profile: deriveProfile(result.user.type_compte, result.user.platform_role),
    platformRole: result.user.platform_role,
    displayName: result.user.nom,
    subtitle: result.user.type_compte,
    formule: null,
  }
}

function friendlyAuthError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Une erreur inattendue est survenue.'
}

interface SessionState {
  session: Session | null
  signup: (email: string, password: string, nom: string, typeCompte: string) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      signup: async (email, password, nom, typeCompte) => {
        try {
          const result = await api.post<BackendAuthResult>(
            '/api/auth/signup',
            { email, password, nom, type_compte: typeCompte },
            false,
          )
          set({ session: toSession(result) })
          return { ok: true }
        } catch (error) {
          return { ok: false, message: friendlyAuthError(error) }
        }
      },
      login: async (email, password) => {
        try {
          const result = await api.post<BackendAuthResult>('/api/auth/login', { email, password }, false)
          set({ session: toSession(result) })
          return { ok: true }
        } catch (error) {
          return { ok: false, message: friendlyAuthError(error) }
        }
      },
      logout: () => set({ session: null }),
    }),
    { name: 'nouankany-session' },
  ),
)
