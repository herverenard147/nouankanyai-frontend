import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { Breadcrumb, crumbsFor } from '@/components/layout/Breadcrumb'
import { useBreadcrumbStore } from '@/store/breadcrumbStore'

/** Fil d'Ariane (2026-10-20) : revenir à la page précédente sans bouton retour. */
describe('fil d’Ariane', () => {
  it('page du menu : Vue d’ensemble › page, la page en cours sans lien', () => {
    expect(crumbsFor('industrie', '/app/consommation', null)).toEqual([
      { label: 'Vue d\'ensemble', to: '/app/apercu' },
      { label: 'Conso & coûts' },
    ])
    expect(crumbsFor('industrie', '/app/apercu', null)).toEqual([{ label: "Vue d'ensemble" }])
  })

  it('page de détail : le nom donné par la page, sinon « Détail »', () => {
    const crumbs = crumbsFor('industrie', '/app/boitier/abc', 'Passerelle atelier')
    expect(crumbs.map((c) => c.label)).toEqual(['Vue d\'ensemble', crumbs[1].label, 'Passerelle atelier'])
    expect(crumbs[1].to).toBe('/app/boitier')
    expect(crumbsFor('industrie', '/app/boitier/abc', null).at(-1)).toEqual({ label: 'Détail' })
  })

  it('affiché avec des liens vers les pages parentes', () => {
    useBreadcrumbStore.setState({ label: 'Passerelle atelier' })
    render(
      <MemoryRouter initialEntries={['/app/boitier/abc']}>
        <Breadcrumb profile="industrie" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('navigation', { name: 'Fil d’Ariane' })).toBeTruthy()
    expect(screen.getByRole('link', { name: "Vue d'ensemble" }).getAttribute('href')).toBe('/app/apercu')
    expect(screen.getByText('Passerelle atelier').getAttribute('aria-current')).toBe('page')
  })
})

it('ménage : « Facture prévue » est rangée sous « Accueil »', () => {
  expect(crumbsFor('menage', '/app/prediction', null)).toEqual([{ label: 'Accueil', to: '/app/apercu' }, { label: 'Facture prévue' }])
})
