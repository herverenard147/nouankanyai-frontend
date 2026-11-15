import { describe, expect, it } from 'vitest'

import vercelRaw from '../../vercel.json?raw'

describe('S-13 : cache de l\'accueil', () => {
  it('les fichiers hachés de /assets sont en cache immuable', () => {
    const config = JSON.parse(vercelRaw)
    const rule = config.headers.find((h: { source: string }) => h.source === '/assets/(.*)')
    expect(rule.headers).toContainEqual({ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' })
  })
})
