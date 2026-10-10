import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/apiClient'
import { useSessionStore } from '@/store/sessionStore'

// Volet 5 : jeton d'accès de 30 minutes renouvelé en silence ; sans renouvellement possible,
// la session est fermée.
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

function signIn() {
  useSessionStore.setState({
    session: { userId: 'u1', token: 'acces-expire', refreshToken: 'renouvellement-1', profile: 'pme', platformRole: null,
      displayName: 'X', subtitle: 'PME', isTeamOwner: true, isTrial: false, isDemo: false },
  })
}

describe('Renouvellement de session', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ session: null })
  })

  it('renouvelle le jeton puis rejoue la requête', async () => {
    signIn()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(401, { detail: 'Token invalide ou expiré' }))
      .mockResolvedValueOnce(json(200, { token: 'acces-neuf', refresh_token: 'renouvellement-2' }))
      .mockResolvedValueOnce(json(200, [{ id: 's1' }]))
    vi.stubGlobal('fetch', fetchMock)
    const sites = await api.get<{ id: string }[]>('/api/sites')
    expect(sites).toEqual([{ id: 's1' }])
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/auth/refresh')
    const retried = fetchMock.mock.calls[2][1] as RequestInit
    expect((retried.headers as Record<string, string>).Authorization).toBe('Bearer acces-neuf')
    expect(useSessionStore.getState().session?.refreshToken).toBe('renouvellement-2')
  })

  it('ferme la session si le renouvellement est refusé', async () => {
    signIn()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(json(401, { detail: 'Token invalide ou expiré' }))
      .mockResolvedValueOnce(json(401, { detail: 'Session expirée' })))
    await expect(api.get('/api/sites')).rejects.toThrow()
    expect(useSessionStore.getState().session).toBeNull()
  })
})
