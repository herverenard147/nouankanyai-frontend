import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/store/sessionStore'

// S-26 : la déconnexion révoque le jeton de renouvellement côté serveur (POST /api/auth/logout)
// sans jamais bloquer la déconnexion locale.
const session = {
  userId: 'u1', token: 'ACCES', refreshToken: 'RENOUV-X', profile: 'pme' as const, platformRole: null,
  displayName: 'X', subtitle: 'PME', isTeamOwner: true, isTrial: false, isDemo: false,
}

describe('Déconnexion et révocation serveur', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ session: null })
  })

  it('appelle POST /api/auth/logout avec le jeton de renouvellement', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"status":"success"}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    useSessionStore.setState({ session })
    useSessionStore.getState().logout()
    expect(useSessionStore.getState().session).toBeNull()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/auth/logout')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(JSON.parse(String(init.body))).toEqual({ refresh_token: 'RENOUV-X' })
  })

  it("déconnecte quand même si l'appel échoue", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau coupé')))
    useSessionStore.setState({ session })
    expect(() => useSessionStore.getState().logout()).not.toThrow()
    expect(useSessionStore.getState().session).toBeNull()
    await Promise.resolve()
  })

  it("n'appelle rien sans jeton de renouvellement", () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    useSessionStore.setState({ session: { ...session, refreshToken: undefined } })
    useSessionStore.getState().logout()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
