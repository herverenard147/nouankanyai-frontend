import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { TextField } from '@/components/ui/TextField'
import { LoginPage } from '@/pages/auth/LoginPage'

// WCAG 2.1 AA : 1.4.11 (bordure des champs ≥ 3:1), 4.1.3 (erreur annoncée), 4.1.2 (état des onglets).
// --color-text-tertiary #6e6e64 : 5,15 sur blanc, 4,93 sur --color-bg (calcul WCAG) ; l'ancien #e2e1db : 1,31.
describe('Accessibilité des formulaires', () => {
  it('la bordure des champs utilise une couleur du thème à contraste suffisant', () => {
    render(<TextField label="Email" />)
    const classes = screen.getByLabelText('Email').className
    expect(classes).toContain('border-text-tertiary')
    expect(classes).not.toContain('border-border')
  })

  it("l'erreur d'un champ est annoncée (role=alert) et reliée au champ", () => {
    render(<TextField label="Email" error="Adresse incomplète" />)
    const alerte = screen.getByRole('alert')
    expect(alerte.textContent).toBe('Adresse incomplète')
    expect(screen.getByLabelText('Email').getAttribute('aria-describedby')).toBe(alerte.id)
  })

  it("les boutons Connexion / Inscription exposent l'état choisi", () => {
    render(<MemoryRouter initialEntries={['/login']}><LoginPage /></MemoryRouter>)
    const connexion = screen.getByRole('button', { name: 'Se connecter', pressed: true })
    const inscription = screen.getByRole('button', { name: 'Créer un compte', pressed: false })
    fireEvent.click(inscription)
    expect(screen.getByRole('button', { name: 'Créer un compte', pressed: true })).toBeTruthy()
    expect(connexion.getAttribute('aria-pressed')).toBe('false')
  })
})
