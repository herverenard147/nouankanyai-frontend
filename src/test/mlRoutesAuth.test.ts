import { afterEach, describe, expect, it, vi } from 'vitest'

import { rawMlHealth, rawMlModels } from '@/api/rawBackend'
import { useSessionStore } from '@/store/sessionStore'

function sentAuthorization(fetchMock: ReturnType<typeof vi.fn>): string | undefined {
  const init = fetchMock.mock.calls[0][1] as RequestInit
  return (init.headers as Record<string, string>).Authorization
}

describe('Routes du modèle : le jeton de l’admin est envoyé', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ session: null })
  })

  function stubFetch(body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  function signIn(token: string) {
    useSessionStore.setState({
      session: { userId: 'u1', token, profile: 'admin', platformRole: 'superadmin', displayName: 'Admin', subtitle: 'Admin', isTeamOwner: false, isTrial: false, isDemo: false },
    })
  }

  it('GET /api/v1/ml/health porte le jeton : le backend ne donne le détail qu’à un admin connecté', async () => {
    signIn('jeton-admin')
    const fetchMock = stubFetch({ status: 'healthy', timestamp: '2026-10-10T00:00:00Z' })
    await rawMlHealth()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/v1/ml/health')
    expect(sentAuthorization(fetchMock)).toBe('Bearer jeton-admin')
  })

  it('GET /api/v1/ml/models porte le jeton : route réservée aux administrateurs', async () => {
    signIn('jeton-admin')
    const fetchMock = stubFetch([])
    await rawMlModels()
    expect(sentAuthorization(fetchMock)).toBe('Bearer jeton-admin')
  })
})
