import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/components/ui/Button'

// Retour du propriétaire (2026-10-11) : un bouton qui lance un calcul doit montrer qu'il se passe quelque chose.
describe('Bouton en attente', () => {
  it('montre une roue, se désactive et s’annonce occupé', () => {
    render(<Button loading>Vérifier</Button>)
    const button = screen.getByRole('button', { name: 'Vérifier' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('svg.animate-spin')).not.toBeNull()
  })

  it('au repos, pas de roue', () => {
    render(<Button>Vérifier</Button>)
    const button = screen.getByRole('button', { name: 'Vérifier' })
    expect(button).not.toBeDisabled()
    expect(button.querySelector('svg')).toBeNull()
  })
})
