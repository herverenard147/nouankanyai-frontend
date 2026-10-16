import { create } from 'zustand'

interface InterventionState {
  /** Compte du client dans lequel le technicien travaille (null hors intervention). */
  accountId: string | null
  accountName: string | null
  start: (accountId: string, accountName: string) => void
  stop: () => void
}

/**
 * Intervention d'un technicien Nouankany dans le compte d'un client (accès accordé par le client). Tant qu'elle est
 * en cours, `apiClient` ajoute l'en-tête `X-Intervention-Compte` aux routes d'installation. Volontairement non
 * persistée : un rechargement de page ramène le technicien à sa liste de comptes.
 */
export const useInterventionStore = create<InterventionState>()((set) => ({
  accountId: null,
  accountName: null,
  start: (accountId, accountName) => set({ accountId, accountName }),
  stop: () => set({ accountId: null, accountName: null }),
}))
