import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, rawSeedDemoData: () => Promise.resolve({ profile: 'industrie', sites_created: 1, machines_created: 5, bills_created: 0 }) }
})

import { useSeedDemoData } from '@/hooks/queries/useDemo'

/** Régression : le chargement des données de démonstration doit se terminer dès la réponse du serveur,
 *  sans attendre qu'une requête lente de l'écran (prévision, recommandation) ait fini de se rafraîchir. */
describe('useSeedDemoData', () => {
  it('ne reste pas « en cours » tant qu’une requête de l’écran se rafraîchit', async () => {
    const client = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
    const { result } = renderHook(
      () => {
        useQuery({ queryKey: ['lente'], queryFn: () => new Promise<never>(() => {}) })
        return useSeedDemoData()
      },
      { wrapper },
    )
    act(() => result.current.mutate(undefined))
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 2000 })
  })
})
