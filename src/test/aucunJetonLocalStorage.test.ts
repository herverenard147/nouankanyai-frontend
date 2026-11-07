import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Règle : aucun code ne range un jeton dans localStorage (lisible par un XSS).
describe('Jetons hors localStorage', () => {
  it('sessionStore ne désigne pas localStorage et retire le jeton d\'accès (partialize)', () => {
    const source = readFileSync('src/store/sessionStore.ts', 'utf8')
    expect(source).toMatch(/partialize/)
    expect(source).not.toMatch(/localStorage\.setItem/)
    expect(source).not.toMatch(/createJSONStorage\(\s*\(\)\s*=>\s*localStorage/)
  })
})
