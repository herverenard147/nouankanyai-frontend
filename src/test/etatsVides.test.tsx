import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { MetricState } from '@/components/state/MetricState'
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
