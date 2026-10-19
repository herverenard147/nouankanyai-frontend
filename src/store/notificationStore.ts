import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Badges de notification (menu "Alertes"/"Conseils" de la sidebar) : le
 * badge affiche le nombre d'éléments actuellement actifs qui n'ont pas
 * encore été "vus". Visiter la page dédiée (`/app/alertes`, `/app/conseils`)
 * marque tous les éléments actuellement affichés comme vus (remplace la
 * liste, ne l'additionne pas) : le badge retombe à 0, et ne remonte que si
 * un NOUVEL élément apparaît ensuite. Résoudre une alerte la fait
 * disparaître de la liste active, ce qui décrémente déjà naturellement le
 * badge sans logique supplémentaire.
 */
interface NotificationState {
  seenAlertIds: string[]
  seenAdviceIds: string[]
  /** Notifications de la cloche déjà vues (identifiants stables du serveur et des conseils). */
  seenNotificationIds: string[]
  markNotificationsSeen: (ids: string[]) => void
  markAlertsSeen: (ids: string[]) => void
  markAdviceSeen: (ids: string[]) => void
  /** À appeler depuis sessionStore.logout() : sans ça, le "vu" d'un compte
   * reste en localStorage et s'applique au compte suivant qui se connecte
   * sur le même appareil (démo/poste partagé), masquant potentiellement de
   * vraies nouvelles alertes du compte B comme si elles avaient déjà été vues. */
  resetSeen: () => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      seenAlertIds: [],
      seenAdviceIds: [],
      seenNotificationIds: [],
      // Ajoute sans perdre les autres ; plafonné pour que le stockage du navigateur ne grossisse pas sans fin.
      markNotificationsSeen: (ids) => set((s) => ({ seenNotificationIds: [...new Set([...ids, ...s.seenNotificationIds])].slice(0, 500) })),
      markAlertsSeen: (ids) => set({ seenAlertIds: ids }),
      markAdviceSeen: (ids) => set({ seenAdviceIds: ids }),
      resetSeen: () => set({ seenAlertIds: [], seenAdviceIds: [], seenNotificationIds: [] }),
    }),
    { name: 'nouankany-notifications' },
  ),
)
