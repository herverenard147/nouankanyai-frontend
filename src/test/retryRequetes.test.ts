import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/apiClient'
import { queryClient, retryDelay, shouldRetry } from '../lib/queryClient'

// S-11 (audit P8) : Render gratuit se réveille en environ 100 s ; une lecture qui échoue parce que le serveur dort
// (réseau ou 502/503/504) est retentée 2 fois. Une erreur du client (401, 403, 404, 422) ou 500 ne l'est jamais.
describe('nouvelle tentative des lectures', () => {
  it('retente 2 fois une panne réseau ou une passerelle indisponible', () => {
    for (const status of [0, 502, 503, 504]) {
      expect(shouldRetry(0, new ApiError('x', status))).toBe(true)
      expect(shouldRetry(1, new ApiError('x', status))).toBe(true)
      expect(shouldRetry(2, new ApiError('x', status))).toBe(false)
    }
  })

  it('ne retente pas une erreur de requête ou une erreur serveur', () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
      expect(shouldRetry(0, new ApiError('x', status))).toBe(false)
    }
    expect(shouldRetry(0, new Error('autre'))).toBe(false)
  })

  it('attend plus longtemps à chaque tentative, au plus 30 s', () => {
    expect(retryDelay(0)).toBeLessThan(retryDelay(1))
    expect(retryDelay(10)).toBeLessThanOrEqual(30_000)
  })

  it('est branchée sur les lectures du client partagé, pas sur les écritures', () => {
    const opts = queryClient.getDefaultOptions()
    expect(opts.queries?.retry).toBe(shouldRetry)
    expect(opts.queries?.retryDelay).toBe(retryDelay)
    expect(opts.mutations?.retry ?? false).toBe(false)
  })
})
