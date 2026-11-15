import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/store/sessionStore'

// S-20 : `is_trial` reste vrai à vie côté serveur ; le site doit suivre `trial_active`.
function reponse(user: Record<string, unknown>) {
  return new Response(JSON.stringify({ token: 't', refresh_token: 'r', user: { id: 'u', email: 'a@b.ci', nom: 'A', type_compte: 'Particulier', role: 'user', platform_role: null, owner_id: null, ...user } }), {
    status: 200, headers: { 'content-type': 'application/json' },
  })
}

describe('Essai gratuit : trial_active', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ session: null })
  })

  it("is_trial vrai mais trial_active faux : l'essai n'est plus actif", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse({ is_trial: true, trial_active: false })))
    await useSessionStore.getState().login('a@b.ci', 'x')
    expect(useSessionStore.getState().session?.isTrial).toBe(false)
  })

  it('trial_active vrai : essai actif', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reponse({ is_trial: true, trial_active: true })))
    await useSessionStore.getState().login('a@b.ci', 'x')
    expect(useSessionStore.getState().session?.isTrial).toBe(true)
  })
})
