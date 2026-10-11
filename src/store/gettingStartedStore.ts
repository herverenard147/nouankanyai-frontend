import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GettingStartedState {
  /** Étapes ouvertes, par compte. */
  visitedByUser: Record<string, string[]>
  /** Comptes qui ont masqué le rappel sur la vue d'ensemble. */
  dismissedByUser: Record<string, boolean>
  markVisited: (userId: string, stepId: string) => void
  dismiss: (userId: string) => void
}

/** Préférence locale à l'appareil, comme le niveau d'affichage : rien n'est envoyé au serveur. */
export const useGettingStartedStore = create<GettingStartedState>()(
  persist(
    (set) => ({
      visitedByUser: {},
      dismissedByUser: {},
      markVisited: (userId, stepId) =>
        set((state) => {
          const current = state.visitedByUser[userId] ?? []
          if (current.includes(stepId)) return state
          return { visitedByUser: { ...state.visitedByUser, [userId]: [...current, stepId] } }
        }),
      dismiss: (userId) => set((state) => ({ dismissedByUser: { ...state.dismissedByUser, [userId]: true } })),
    }),
    { name: 'nouankany-premiers-pas' },
  ),
)

const NONE: string[] = []

export const useVisitedSteps = (userId: string) => useGettingStartedStore((s) => s.visitedByUser[userId] ?? NONE)
export const useStartDismissed = (userId: string) => useGettingStartedStore((s) => Boolean(s.dismissedByUser[userId]))
