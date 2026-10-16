import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendAlertEntry } from '@/types/backend'

vi.mock('@/api/rawBackend', () => ({ rawAlertRegistry: vi.fn() }))

import { rawAlertRegistry } from '@/api/rawBackend'
import { AlertNotifier } from '@/components/alerts/AlertNotifier'
import { useInterventionStore } from '@/store/interventionStore'
import { useSessionStore } from '@/store/sessionStore'

const alert = (id: string, machine: string): BackendAlertEntry =>
  ({ id, machine_nom: machine, machine_code: id, kind_label: 'Surchauffe', level: 'alerte', title: 'Surchauffe' }) as BackendAlertEntry

function setup(profile: string) {
  useSessionStore.setState({ session: { profile, token: 't' } as never })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AlertNotifier />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}

describe('notification des nouvelles alertes quand le client est connecté', () => {
  beforeEach(() => {
    vi.mocked(rawAlertRegistry).mockReset()
    useInterventionStore.setState({ accountId: null } as never)
  })

  it('n’annonce rien au premier chargement, puis annonce l’alerte apparue pendant la visite', async () => {
    vi.mocked(rawAlertRegistry).mockResolvedValueOnce([alert('a1', 'Four')]).mockResolvedValueOnce([alert('a1', 'Four'), alert('a2', 'Climatiseur')])
    const client = setup('pme')
    await waitFor(() => expect(client.getQueryData(['alert-registry-open-poll'])).toBeDefined())
    await new Promise((r) => setTimeout(r, 0))   // l'effet a pris connaissance des alertes déjà ouvertes
    expect(screen.queryByRole('status')).toBeNull()
    await act(() => client.refetchQueries({ queryKey: ['alert-registry-open-poll'] }))
    expect(await screen.findByText(/Nouvelle alerte : Climatiseur/)).toBeInTheDocument()
    expect(screen.queryByText(/Four/)).toBeNull()
  })

  it('ne tourne pas pour un administrateur', async () => {
    setup('admin')
    await new Promise((r) => setTimeout(r, 50))
    expect(rawAlertRegistry).not.toHaveBeenCalled()
  })
})
