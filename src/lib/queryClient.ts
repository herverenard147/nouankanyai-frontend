import { MutationCache, QueryClient } from '@tanstack/react-query'

/**
 * Instance partagée, exportée (pas seulement locale à App.tsx) pour que la
 * couche `src/api/*` puisse l'utiliser comme cache de déduplication via
 * `queryClient.fetchQuery` — notamment pour `/api/machines`, interrogé en
 * doublon par plusieurs widgets indépendants sur une même page (KPI,
 * prédiction, alertes, machines suivies) sans que ces widgets se parlent.
 *
 * `staleTime` par défaut (20 s) : les données backend (relevés capteurs,
 * prédictions) ne changent pas assez vite pour justifier un refetch à
 * chaque changement d'écran ou chaque montage de composant — sans ça,
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
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
})
