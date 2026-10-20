import { describe, expect, it } from 'vitest'

// Un cadre qui défile en largeur doit être `relative` : sinon les textes cachés pour les lecteurs
// d'écran (`sr-only`, en position absolue) sortent du cadre et élargissent toute la page. Vu sur
// téléphone le 2026-10-20 : la carte de chaleur faisait défiler Conso & coûts sur 766 px.
const sources = import.meta.glob('../**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('cadres défilants', () => {
  it('chaque <div> qui défile en largeur est relative', () => {
    const fautifs = Object.entries(sources).flatMap(([path, text]) =>
      [...text.matchAll(/<div className="([^"]*\boverflow-x-auto\b[^"]*)"/g)]
        .filter((m) => !/\b(relative|absolute|fixed|sticky)\b/.test(m[1]))
        .map((m) => `${path}: ${m[1]}`),
    )
    expect(Object.keys(sources).length).toBeGreaterThan(50)
    expect(fautifs).toEqual([])
  })
})
