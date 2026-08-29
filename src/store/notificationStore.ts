import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Badges de notification (menu "Alertes"/"Conseils" de la sidebar) : le
 * badge affiche le nombre d'éléments actuellement actifs qui n'ont pas
 * encore été "vus". Visiter la page dédiée (`/app/alertes`, `/app/conseils`)
 * marque tous les éléments actuellement affichés comme vus (remplace la
 * liste, ne l'additionne pas) — le badge retombe à 0, et ne remonte que si
 * un NOUVEL élément apparaît ensuite. Résoudre une alerte la fait
 * disparaître de la liste active, ce qui décrémente déjà naturellement le
 * badge sans logique supplémentaire.
 */
interface NotificationState {
  seenAlertIds: string[]
  seenAdviceIds: string[]
  markAlertsSeen: (ids: string[]) => void
  markAdviceSeen: (ids: string[]) => void
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      seenAlertIds: [],
      seenAdviceIds: [],
      markAlertsSeen: (ids) => set({ seenAlertIds: ids }),
      markAdviceSeen: (ids) => set({ seenAdviceIds: ids }),
    }),
    { name: 'nouankany-notifications' },
  ),
)
