import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/** D14 (décisions CNID du 2026-11-10) : le scénario « supermarché » simulé se charge depuis un compte industrie vide. */
const seed = vi.fn((_scenario?: string) => Promise.resolve({ profile: 'industrie', sites_created: 1, machines_created: 5, bills_created: 0 }))
vi.mock('@/api/rawBackend', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/api/rawBackend')>()
  return { ...original, rawSeedDemoData: (scenario?: string) => seed(scenario) }
})
vi.mock('@/hooks/queries/useRawMachines', () => ({ useRawMachines: () => ({ status: 'success', data: [] }) }))

import { DemoDataBanner } from '@/components/demo/DemoDataBanner'
import { useSessionStore } from '@/store/sessionStore'

function show(session: Record<string, unknown>) {
  useSessionStore.setState({ session } as never)
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <DemoDataBanner />
    </QueryClientProvider>,
  )
}

describe('scénario supermarché (D14)', () => {
  beforeEach(() => seed.mockClear())

  it('un compte industrie de démonstration vide peut charger le scénario supermarché, dit simulé', async () => {
    show({ profile: 'industrie', isTrial: false, isDemo: true })
    const button = screen.getByRole('button', { name: /supermarché \(simulé\)/i })
    fireEvent.click(button)
    await waitFor(() => expect(seed).toHaveBeenCalledWith('supermarche'))
    expect(screen.getByText(/chambres froides/i)).toBeTruthy()
  })

  it('pas de scénario supermarché pour un ménage ou une PME', () => {
    show({ profile: 'pme', isTrial: true, isDemo: false })
    expect(screen.queryByRole('button', { name: /supermarché/i })).toBeNull()
    expect(screen.getByRole('button', { name: 'Charger des données de démonstration' })).toBeTruthy()
  })

  it('un compte réel ne voit rien', () => {
    const { container } = show({ profile: 'industrie', isTrial: false, isDemo: false })
    expect(container.textContent).toBe('')
  })
})
