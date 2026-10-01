import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  BOITIER_PHRASES,
  BOITIER_STATES,
  DEMO_CYCLE,
  WAKE_PHRASE,
  boitierState,
} from '@/components/boitier/boitierStates'
import { BoitierPage } from '@/pages/boitier/BoitierPage'
import { BoitierSection } from '@/pages/landing/sections/BoitierSection'
import { NavBar } from '@/pages/landing/sections/NavBar'

describe('lumières du boîtier', () => {
  it('a quatre lumières de couleurs toutes différentes', () => {
    expect(BOITIER_STATES.map((state) => state.id)).toEqual(['ecoute', 'vert', 'orange', 'rouge'])
    expect(new Set(BOITIER_STATES.map((state) => state.led)).size).toBe(4)
  })

  it('réserve le vert à « tout va bien » : l’écoute est blanche', () => {
    expect(boitierState('ecoute').led).toBe('#ffffff')
    expect(boitierState('vert').meaning).toMatch(/dans leurs seuils/)
  })

  it('fait commencer chaque échange d’état par la phrase d’activation, sans chiffre inventé', () => {
    for (const state of BOITIER_STATES.filter((item) => item.id !== 'ecoute')) {
      expect(state.dialog[0]).toMatchObject({ who: 'Vous' })
      expect(state.dialog[0]?.text).toContain(WAKE_PHRASE)
      state.dialog.forEach((line) => expect(line.text).not.toMatch(/\d/))
    }
  })

  it('ne montre en boucle que les trois lumières d’état', () => {
    expect(DEMO_CYCLE).toEqual(['vert', 'orange', 'rouge'])
  })

  it('propose plusieurs formulations pour la plupart des demandes', () => {
    expect(BOITIER_PHRASES.length).toBeGreaterThanOrEqual(6)
    BOITIER_PHRASES.forEach((group) => expect(group.phrases.length).toBeGreaterThanOrEqual(2))
  })
})

describe('annonce et page du boîtier', () => {
  it('ajoute « Le boîtier » à la navbar, vers sa propre page', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    )
    const links = screen.getAllByRole('link', { name: 'Le boîtier' })
    links.forEach((link) => expect(link).toHaveAttribute('href', '/le-boitier'))
    expect(links.length).toBeGreaterThan(0)
  })

  it('annonce le boîtier sur l’accueil avec un lien vers la page', () => {
    render(
      <MemoryRouter>
        <BoitierSection />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Découvrir le boîtier/ })).toHaveAttribute('href', '/le-boitier')
  })

  it('change la lumière et l’échange quand on choisit un autre état', () => {
    render(
      <MemoryRouter>
        <BoitierPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Lumière rouge/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'À surveiller' }))
    expect(screen.getByText(/Lumière orange/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'À l’écoute' }))
    expect(screen.getByText(/Lumière blanche pulsée/)).toBeInTheDocument()
  })

  it('affiche le schéma 2D quand le navigateur n’a pas de WebGL', () => {
    render(
      <MemoryRouter>
        <BoitierPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('img', { name: /Schéma du boîtier/ })).toBeInTheDocument()
  })
})
