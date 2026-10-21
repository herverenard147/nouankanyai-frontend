import { describe, expect, it } from 'vitest'

/** Demande du propriétaire (2026-10-21) : plus de « NouanKanyAI » ni « NouanKany » dans les textes du site. */
const sources = import.meta.glob(['../**/*.ts', '../**/*.tsx', '!../test/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>

describe('nom du site', () => {
  it('aucun texte visible ne porte l’ancien nom', () => {
    const fautifs = Object.entries(sources).flatMap(([path, text]) =>
      text
        .split('\n')
        .map((line, i) => ({ line: line.trim(), i }))
        // Les commentaires du code ne sont pas vus par les utilisateurs.
        .filter(({ line }) => /NouanKany/.test(line) && !/^(\/\/|\*|\/\*|\{\/\*)/.test(line))
        .map(({ i, line }) => `${path}:${i + 1}: ${line.slice(0, 80)}`),
    )
    expect(Object.keys(sources).length).toBeGreaterThan(50)
    expect(fautifs).toEqual([])
  })
})
