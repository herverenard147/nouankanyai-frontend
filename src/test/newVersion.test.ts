import { describe, expect, it } from 'vitest'

import { isChunkLoadError } from '@/lib/newVersion'

describe('isChunkLoadError', () => {
  it('reconnaît le fichier d’une ancienne version introuvable', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/AdminBillingPage-D0LeIIbJ.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true)
  })
  it('ignore les autres erreurs', () => {
    expect(isChunkLoadError(new Error('Network error'))).toBe(false)
    expect(isChunkLoadError(null)).toBe(false)
  })
})
