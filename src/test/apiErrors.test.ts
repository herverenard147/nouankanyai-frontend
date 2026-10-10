import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/apiClient'

// Volet 2, partie E : une erreur de validation (422) s'affiche en français lisible, jamais en JSON brut.
describe('Messages d’erreur de validation', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stub422(detail: unknown) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail }), { status: 422, headers: { 'content-type': 'application/json' } }),
    ))
  }

  it('traduit un champ manquant et un nombre invalide', async () => {
    stub422([
      { type: 'missing', loc: ['body', 'nom'], msg: 'Field required' },
      { type: 'float_type', loc: ['body', 0, 'power_kw'], msg: 'Input should be a valid number' },
    ])
    const error = await api.post('/api/machines', {}, false).catch((e: Error) => e)
    expect((error as Error).message).toBe('nom : champ obligatoire. power_kw : doit être un nombre.')
    expect((error as Error).message).not.toContain('{')
  })

  it('garde un message déjà rédigé par le serveur', async () => {
    stub422('Mot de passe trop court')
    const error = await api.post('/api/auth/signup', {}, false).catch((e: Error) => e)
    expect((error as Error).message).toBe('Mot de passe trop court')
  })
})
