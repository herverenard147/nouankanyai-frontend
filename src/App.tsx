import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router-dom'

import { router } from '@/routes/router'

const queryClient: QueryClient = new QueryClient({
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
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
