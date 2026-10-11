import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SettingsPage } from '@/pages/app/SettingsPage'
import { useSessionStore } from '@/store/sessionStore'
import type { Session } from '@/types/domain'

const SESSION: Session = {
  userId: 'u1', token: 't', refreshToken: 'r', profile: 'menage', platformRole: null, displayName: 'Awa',
  subtitle: 'Particulier', isTeamOwner: false, isTrial: false, isDemo: false,
}

function renderSettings() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

// Partie Q1 : un utilisateur ne pouvait pas supprimer son propre compte.
describe('Paramètres : supprimer mon compte', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    useSessionStore.setState({ session: SESSION })
    fetchMock = vi.fn(async (url: string) => {
      const body = String(url).includes('/account/delete') ? { deleted: true } : {}
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ session: null })
  })

  it('explique ce qui est effacé et ce qui est gardé', () => {
    renderSettings()
    expect(screen.getByText(/Gardé sans lien avec vous/i)).toBeInTheDocument()
    expect(screen.getByText(/Gardé pour la durée légale/i)).toBeInTheDocument()
  })

  it('n’envoie rien tant que le mot de confirmation n’est pas saisi', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: /Supprimer mon compte…/ }))
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'secret' } })
    expect(screen.getByRole('button', { name: /Supprimer définitivement/i })).toBeDisabled()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/account/delete'))).toBe(false)
  })

  it('envoie le mot de passe et le mot, puis ferme la session', async () => {
    renderSettings()
    fireEvent.click(screen.getByRole('button', { name: /Supprimer mon compte…/ }))
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'secret' } })
    fireEvent.change(screen.getByLabelText(/Saisissez SUPPRIMER/i), { target: { value: 'supprimer' } })
    fireEvent.click(screen.getByRole('button', { name: /Supprimer définitivement/i }))
    await waitFor(() => expect(useSessionStore.getState().session).toBeNull())
    const call = fetchMock.mock.calls.find(([url]) => String(url).includes('/account/delete'))!
    expect(JSON.parse(call[1].body)).toEqual({ password: 'secret', confirmation: 'supprimer' })
  })
})
