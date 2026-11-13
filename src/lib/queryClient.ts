import { MutationCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from './apiClient'

/**
 * Nouvelle tentative des lectures (S-11, audit P8) : l'hébergement gratuit du backend se réveille en environ 100 s.
 * On retente 2 fois seulement une panne réseau (statut 0) ou une passerelle indisponible (502, 503, 504) ; jamais
 * une erreur de requête (401, 403, 404, 422) ni une erreur 500, qui ne changeraient pas au second essai.
 */
export const shouldRetry = (failureCount: number, error: unknown): boolean =>
  failureCount < 2 && error instanceof ApiError && [0, 502, 503, 504].includes(error.status)

/** 3 s, puis 6 s, au plus 30 s. */
export const retryDelay = (attempt: number): number => Math.min(3000 * (attempt + 1), 30_000)

/**
 * Instance partagée, exportée (pas seulement locale à App.tsx) pour que la
 * couche `src/api/*` puisse l'utiliser comme cache de déduplication via
 * `queryClient.fetchQuery` : notamment pour `/api/machines`, interrogé en
 * doublon par plusieurs widgets indépendants sur une même page (KPI,
 * prédiction, alertes, machines suivies) sans que ces widgets se parlent.
 *
 * `staleTime` par défaut (20 s) : les données backend (relevés capteurs,
 * prédictions) ne changent pas assez vite pour justifier un refetch à
 * chaque changement d'écran ou chaque montage de composant : sans ça,
 * naviguer Aperçu → Machines → Aperçu relance tout depuis zéro.
 */
export const queryClient: QueryClient = new QueryClient({
  // Toute écriture réussie (ajout, modification, suppression, vérification…) peut avoir ajouté un événement à l'Audit
  // ou changé le plan d'action : on les rafraîchit sans que chaque mutation ait à y penser.
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['audit'] })
      void queryClient.invalidateQueries({ queryKey: ['action-plan'] })
      void queryClient.invalidateQueries({ queryKey: ['action-plan-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['anomalies-resolutions'] })
    },
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
})
