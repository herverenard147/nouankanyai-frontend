import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { TopBar } from '@/components/layout/TopBar'
import { activeOption, pageLevels } from '@/lib/pageLevels'
import { useLevelStore } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

/** Bouton de niveau page par page (tableau validé le 2026-10-20). */
describe('niveaux proposés par page', () => {
  it('PME et Industrie : seulement les niveaux qui changent la page', () => {
    expect(pageLevels('pme', '/app/apercu')).toEqual(['debutant', 'amateur', 'technique'])
    expect(pageLevels('industrie', '/app/apercu')).toEqual(['amateur', 'technique'])
    expect(pageLevels('industrie', '/app/consommation')).toEqual(['amateur', 'technique'])
    expect(pageLevels('pme', '/app/conseils')).toEqual(['debutant', 'technique'])
    expect(pageLevels('industrie', '/app/boitier/abc')).toEqual(['debutant', 'amateur', 'technique'])
    expect(pageLevels('industrie', '/app/factures')).toEqual([])
    expect(pageLevels('pme', '/app/journal')).toEqual([])
  })

  it('ménage : règle de DESIGN.md inchangée, aucun bouton ; admin et technicien : les trois', () => {
    expect(pageLevels('menage', '/app/conseils')).toEqual([])
    expect(pageLevels('admin', '/app/factures')).toEqual(['debutant', 'amateur', 'technique'])
  })

  it('le bouton allumé est celui du groupe du niveau choisi', () => {
    expect(activeOption('debutant', ['amateur', 'technique'])).toBe('amateur')
    expect(activeOption('amateur', ['debutant', 'technique'])).toBe('technique')
    expect(activeOption('technique', ['amateur', 'technique'])).toBe('technique')
  })
})

describe('barre du haut', () => {
  afterEach(() => {
    useSessionStore.setState({ session: null })
    useLevelStore.setState({ levelByProfile: {} })
  })

  function renderAt(path: string) {
    useSessionStore.setState({
      session: { userId: 'u1', token: 't', refreshToken: 'r', profile: 'industrie', platformRole: null, displayName: 'Usine', subtitle: 'Industrie', isTeamOwner: true, isTrial: false, isDemo: false },
    })
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })}>
        <MemoryRouter initialEntries={[path]}>
          <TopBar />
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  it('Conso & coûts : Amateur et Technique seulement', () => {
    renderAt('/app/consommation')
    expect(screen.queryByRole('button', { name: 'Débutant' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Amateur' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Amateur' }))
    expect(useLevelStore.getState().levelByProfile.industrie).toBe('amateur')
  })

  it('Factures : pas de bouton de niveau', () => {
    renderAt('/app/factures')
    expect(screen.queryByRole('group', { name: "Niveau d'affichage" })).toBeNull()
  })
})
