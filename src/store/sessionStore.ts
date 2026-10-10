import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { api, ApiError } from '@/lib/apiClient'
import { ACCOUNT_TYPE_LABELS, deriveProfile } from '@/lib/profileMapping'
import { useNotificationStore } from '@/store/notificationStore'
import type { BackendAuthResult } from '@/types/backend'
import type { Session } from '@/types/domain'

type AuthResult = { ok: true } | { ok: false; message: string }

function toSession(result: BackendAuthResult): Session {
  const profile = deriveProfile(result.user.type_compte, result.user.platform_role)
  return {
    userId: result.user.id,
    token: result.token,
    profile,
    platformRole: result.user.platform_role,
    displayName: result.user.nom,
    subtitle: profile === 'admin' ? ACCOUNT_TYPE_LABELS.admin : result.user.type_compte,
    // Seuls les PME/Industrie sans owner_id (compte principal, pas membre d'une
    // équipe) peuvent gérer des membres — voir app/api/v1/team/ côté backend.
    isTeamOwner: (profile === 'pme' || profile === 'industrie') && !result.user.owner_id,
    isTrial: result.user.is_trial,
    isDemo: result.user.email.toLowerCase().endsWith('.demo'),
  }
}

function friendlyAuthError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Une erreur inattendue est survenue.'
}

interface SessionState {
  session: Session | null
  signup: (email: string, password: string, nom: string, typeCompte: string, isTrial?: boolean) => Promise<AuthResult>
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => void
  /** Reflète immédiatement un changement de nom (voir useUpdateProfile) partout où
   * `session.displayName` est lu (TopBar, SettingsPage), sans attendre un nouveau
   * login. */
  setDisplayName: (nom: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      signup: async (email, password, nom, typeCompte, isTrial = false) => {
        try {
          const result = await api.post<BackendAuthResult>(
            '/api/auth/signup',
            { email, password, nom, type_compte: typeCompte, is_trial: isTrial },
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
      logout: () => {
        set({ session: null })
        // Le "vu" des alertes/conseils est par appareil (localStorage), pas par
        // compte — sans ce reset, le compte suivant sur un poste partagé/démo
        // hérite du "vu" du précédent (voir notificationStore.resetSeen).
        useNotificationStore.getState().resetSeen()
      },
      setDisplayName: (nom) =>
        set((state) => (state.session ? { session: { ...state.session, displayName: nom } } : state)),
    }),
    { name: 'nouankany-session' },
  ),
)
