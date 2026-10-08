import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { MachineTools } from '@/components/machines/MachineTools'
import { isRouteAllowed } from '@/lib/navConfig'
import { ReportsPage } from '@/pages/app/ReportsPage'
import { AllowedLink } from '@/routes/AllowedLink'
import { useSessionStore } from '@/store/sessionStore'
import type { BackendMachine } from '@/types/backend'
import type { Profile, Session } from '@/types/domain'

/** Lot « une vue pour chaque route gardée » : chaque bouton n'apparaît que pour les profils prévus. */

function login(profile: Profile, extra: Partial<Session> = {}) {
  useSessionStore.setState({
    session: {
      userId: 'u1',
      token: 't',
      profile,
      platformRole: profile === 'admin' ? 'admin' : null,
      displayName: 'Test',
      subtitle: '',
      isTeamOwner: false,
      isTrial: false,
      isDemo: false,
      ...extra,
    },
  })
}

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const machine = (status: string) => ({ machine_id: 'M1', nom: 'Four', status }) as unknown as BackendMachine

afterEach(() => useSessionStore.setState({ session: null }))

describe('outils d’une machine', () => {
  it('propose toujours l’analyse photo ou vidéo', () => {
    login('pme')
    wrap(<MachineTools machine={machine('actif')} />)
    expect(screen.getByRole('button', { name: 'Analyser une photo ou une vidéo' })).toBeTruthy()
  })

  it('« Remettre en état normal » seulement quand la machine est en alerte', () => {
    login('industrie')
    const { unmount } = wrap(<MachineTools machine={machine('actif')} />)
    expect(screen.queryByRole('button', { name: 'Remettre en état normal' })).toBeNull()
    unmount()
    wrap(<MachineTools machine={machine('alerte')} />)
    expect(screen.getByRole('button', { name: 'Remettre en état normal' })).toBeTruthy()
  })

  it('« Simuler une alerte » seulement sur un compte d’essai ou de démonstration', () => {
    login('menage')
    const { unmount } = wrap(<MachineTools machine={machine('actif')} />)
    expect(screen.queryByRole('button', { name: /Simuler une alerte/ })).toBeNull()
    unmount()
    login('menage', { isTrial: true })
    const second = wrap(<MachineTools machine={machine('actif')} />)
    expect(screen.getByRole('button', { name: /Simuler une alerte/ })).toBeTruthy()
    second.unmount()
    login('pme', { isDemo: true })
    wrap(<MachineTools machine={machine('actif')} />)
    expect(screen.getByRole('button', { name: /Simuler une alerte/ })).toBeTruthy()
  })
})

describe('rapports', () => {
  it('le Ménage télécharge un PDF mensuel, sans choix de format', () => {
    login('menage')
    wrap(<ReportsPage />)
    expect(screen.queryByLabelText('Format')).toBeNull()
    expect(screen.getByRole('button', { name: /mensuel \(PDF\)/ })).toBeTruthy()
  })

  it('la PME choisit entre PDF et Excel, l’Industrie a aussi Word et PowerPoint', () => {
    login('pme')
    const { unmount } = wrap(<ReportsPage />)
    const pmeFormats = Array.from((screen.getByLabelText('Format') as HTMLSelectElement).options).map((o) => o.text)
    expect(pmeFormats).toEqual(['PDF', 'Excel'])
    unmount()
    login('industrie')
    wrap(<ReportsPage />)
    const formats = Array.from((screen.getByLabelText('Format') as HTMLSelectElement).options).map((o) => o.text)
    expect(formats).toEqual(['PDF', 'Word', 'PowerPoint', 'Excel'])
  })
})

describe('accès aux nouvelles pages', () => {
  it('Rapports et facturation pour les comptes clients, pas pour l’Admin', () => {
    for (const profile of ['menage', 'pme', 'industrie'] as const) {
      expect(isRouteAllowed('/app/rapports', profile)).toBe(true)
      expect(isRouteAllowed('/app/facturation', profile)).toBe(true)
    }
    expect(isRouteAllowed('/app/rapports', 'admin')).toBe(false)
    expect(isRouteAllowed('/app/facturation', 'admin')).toBe(false)
  })

  it('Messages et inscriptions réservé à l’Admin', () => {
    expect(isRouteAllowed('/app/admin/messages', 'admin')).toBe(true)
    for (const profile of ['menage', 'pme', 'industrie'] as const) expect(isRouteAllowed('/app/admin/messages', profile)).toBe(false)
  })

  it('un lien vers une page interdite n’est pas affiché', () => {
    login('menage')
    const { unmount } = wrap(<AllowedLink to="/app/audit">Voir l’Audit</AllowedLink>)
    expect(screen.queryByText('Voir l’Audit')).toBeNull()
    unmount()
    login('pme')
    wrap(<AllowedLink to="/app/audit">Voir l’Audit</AllowedLink>)
    expect(screen.getByText('Voir l’Audit')).toBeTruthy()
  })
})
