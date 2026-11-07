import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/apiClient'
import { useSessionStore } from '@/store/sessionStore'

// Jeton d'accès en mémoire seulement, jeton de renouvellement en sessionStorage : rien de
// sensible en localStorage, lisible par un XSS pendant 30 jours.
const KEY = 'nouankany-session'

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const session = {
  userId: 'u1', token: 'ACCES-SECRET', refreshToken: 'RENOUV-SECRET', profile: 'pme' as const, platformRole: null,
  displayName: 'X', subtitle: 'PME', isTeamOwner: true, isTrial: false, isDemo: false,
}

describe('Stockage du jeton de session', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ session: null })
  })

  it("n'écrit ni jeton d'accès ni jeton de renouvellement en localStorage", () => {
    useSessionStore.setState({ session })
    const all = JSON.stringify({ ...localStorage })
    expect(all).not.toContain('ACCES-SECRET')
    expect(all).not.toContain('RENOUV-SECRET')
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it("garde le renouvellement en sessionStorage et l'accès jamais écrit", () => {
    useSessionStore.setState({ session })
    const stored = sessionStorage.getItem(KEY) ?? ''
    expect(stored).toContain('RENOUV-SECRET')
    expect(stored).not.toContain('ACCES-SECRET')
  })

  it("migre l'ancienne clé localStorage vers sessionStorage puis la supprime", async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { session }, version: 0 }))
    await useSessionStore.persist.rehydrate()
    expect(localStorage.getItem(KEY)).toBeNull()
    const stored = sessionStorage.getItem(KEY) ?? ''
    expect(stored).toContain('RENOUV-SECRET')
    expect(stored).not.toContain('ACCES-SECRET')
    expect(useSessionStore.getState().session?.userId).toBe('u1')
    expect(useSessionStore.getState().session?.token).toBe('')
  })

  it("au rechargement, ré-obtient l'accès par le renouvellement avant la première requête", async () => {
    sessionStorage.setItem(KEY, JSON.stringify({ state: { session: { ...session, token: undefined } }, version: 0 }))
    await useSessionStore.persist.rehydrate()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { token: 'ACCES-NEUF', refresh_token: 'RENOUV-2' }))
      .mockResolvedValueOnce(json(200, [{ id: 's1' }]))
    vi.stubGlobal('fetch', fetchMock)
    await api.get('/api/sites')
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/auth/refresh')
    const headers = (fetchMock.mock.calls[1][1] as RequestInit).headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer ACCES-NEUF')
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('la déconnexion efface tout', () => {
    useSessionStore.setState({ session })
    useSessionStore.getState().logout()
    expect(sessionStorage.getItem(KEY) ?? '').not.toContain('RENOUV-SECRET')
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(useSessionStore.getState().session).toBeNull()
  })

  it('un seul renouvellement même si plusieurs requêtes expirent en parallèle', async () => {
    useSessionStore.setState({ session })
    let refreshes = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/api/auth/refresh')) {
        refreshes += 1
        return json(200, { token: 'ACCES-NEUF', refresh_token: 'RENOUV-2' })
      }
      const auth = (init?.headers as Record<string, string>).Authorization
      return auth === 'Bearer ACCES-NEUF' ? json(200, { ok: true }) : json(401, { detail: 'expiré' })
    }))
    await Promise.all([api.get('/api/a'), api.get('/api/b'), api.get('/api/c')])
    expect(refreshes).toBe(1)
  })
})
