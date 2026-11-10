import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import vercelJson from '../../vercel.json?raw'

import { PhotoSlider } from '@/components/landing/PhotoSlider'

/**
 * S-13 (audits du 2026-11-10, P5 et P6) : l'accueil pesait environ 3,2 Mo et les fichiers hachés étaient servis avec
 * `max-age=0` ; le logo de 892 px (426 ko) était affiché en 26 à 40 px.
 */
type VercelConfig = { headers: { source: string; headers: { key: string; value: string }[] }[] }

describe('cache et poids de l’accueil (S-13)', () => {
  it('les fichiers hachés de /assets sont mis en cache un an, immuables', () => {
    const config = JSON.parse(vercelJson) as VercelConfig
    const rule = config.headers.find((h) => h.source === '/assets/(.*)')
    const cache = rule?.headers.find((h) => h.key === 'Cache-Control')?.value
    expect(cache).toBe('public, max-age=31536000, immutable')
  })

  it('le site n’affiche plus le logo de 426 ko ni les photos JPEG pleine taille', () => {
    const files = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/test/**'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>
    const offenders = Object.entries(files)
      .filter(([, text]) => /["'`]\/logo\.png["'`]|\/images\/profiles\/[a-z-]+\.jpg/.test(text))
      .map(([path]) => path)
    expect(offenders).toEqual([])
  })

  it('les photos des profils se chargent à la demande', () => {
    const { container } = render(<PhotoSlider images={['/a.webp', '/b.webp']} label="x" />)
    const images = Array.from(container.querySelectorAll('img'))
    expect(images.length).toBeGreaterThan(0)
    images.forEach((img) => expect(img.getAttribute('loading')).toBe('lazy'))
  })
})
