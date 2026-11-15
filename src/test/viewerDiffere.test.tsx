import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Performance : three.js et le GLB (2,18 Mo) ne se chargent plus d'office sur l'accueil, seulement à l'approche du
// visualiseur, et jamais sur écran étroit ni en économie de données.
vi.mock('@/components/boitier/Boitier3D', () => ({ default: () => <div data-testid="vue-3d" /> }))
import { BoitierViewer } from '@/components/boitier/BoitierViewer'

let observers: { callback: IntersectionObserverCallback }[] = []

function installer(options: { etroit?: boolean; economieDonnees?: boolean; saveData?: boolean } = {}) {
  vi.stubGlobal('WebGLRenderingContext', function () {})
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never)
  vi.stubGlobal('IntersectionObserver', class {
    callback: IntersectionObserverCallback
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; observers.push(this) }
    observe() {}
    disconnect() {}
    unobserve() {}
  })
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: (query.includes('max-width') && !!options.etroit) || (query.includes('prefers-reduced-data') && !!options.economieDonnees),
    media: query, addEventListener() {}, removeEventListener() {},
  }))
  Object.defineProperty(navigator, 'connection', { value: { saveData: !!options.saveData }, configurable: true })
}

const entrer = () => act(async () => { observers.forEach((o) => o.callback([{ isIntersecting: true } as IntersectionObserverEntry], o as never)) })

describe('Visualiseur 3D du boîtier différé', () => {
  beforeEach(() => { observers = [] })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  it("ne charge la 3D qu'à l'entrée dans le viewport", async () => {
    installer()
    render(<BoitierViewer state="vert" />)
    expect(screen.queryByTestId('vue-3d')).toBeNull()
    await entrer()
    expect(await screen.findByTestId('vue-3d')).toBeTruthy()
  })

  it.each([
    ['écran étroit', { etroit: true }],
    ['préférence prefers-reduced-data', { economieDonnees: true }],
    ['économie de données du navigateur', { saveData: true }],
  ])('ne charge jamais la 3D : %s', async (_nom, options) => {
    installer(options)
    render(<BoitierViewer state="vert" />)
    await entrer()
    expect(screen.queryByTestId('vue-3d')).toBeNull()
  })
})
