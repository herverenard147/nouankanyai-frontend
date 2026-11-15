import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { MetricState } from '@/components/state/MetricState'
import { MutationError } from '@/components/ui/Modal'
import { addEquipmentAction } from '@/lib/navConfig'

describe('S-46 : un état vide propose une action', () => {
  it('sans action, le texte seul reste (comportement inchangé)', () => {
    render(<MetricState status="success" isEmpty>x</MetricState>)
    expect(screen.getByText('Aucune donnée pour le moment.')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })
  it('avec action, un lien mène à la page où agir', () => {
    render(<MemoryRouter><MetricState status="success" isEmpty emptyAction={addEquipmentAction('pme')}>x</MetricState></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Ajouter un équipement/ }).getAttribute('href')).toBe('/app/equipements')
  })
  it('vocabulaire et page selon le type de compte', () => {
    expect(addEquipmentAction('menage')).toEqual({ to: '/app/equipements', label: 'Ajouter un appareil' })
    expect(addEquipmentAction('industrie')).toEqual({ to: '/app/machines', label: 'Ajouter une machine' })
  })
})

describe('erreurs annoncées et récupérables', () => {
  it('un état vide peut proposer une action qui ouvre un formulaire', () => {
    const onClick = vi.fn()
    render(<MetricState status="success" isEmpty emptyAction={{ label: 'Ajouter un appareil', onClick }}>x</MetricState>)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter un appareil/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('l’erreur de chargement est annoncée et propose Réessayer quand onRetry existe', () => {
    const onRetry = vi.fn()
    render(<MetricState status="error" onRetry={onRetry}>x</MetricState>)
    expect(screen.getByRole('alert').textContent).toContain('Indisponible.')
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
  it('sans onRetry, aucun bouton', () => {
    render(<MetricState status="error">x</MetricState>)
    expect(screen.queryByRole('button')).toBeNull()
  })
  it('MutationError est annoncée', () => {
    render(<MemoryRouter><MutationError error={new Error('x')} /></MemoryRouter>)
    expect(screen.getByRole('alert').textContent).toContain('Réessayez')
  })
})
