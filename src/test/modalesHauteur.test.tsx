import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Modal } from '@/components/ui/Modal'

/**
 * Test du site du 2026-10-18 : une modale longue dépassait l'écran (titre, × et boutons hors d'atteinte en
 * 1366×570). La boîte est bornée à la hauteur de l'écran, en-tête et pied ne rétrécissent pas, seul le corps
 * défile. Le contrôle visuel réel (vrais écrans bas) est dans e2e/modalesHauteur.spec.ts.
 */
describe('Modal : jamais plus haute que l’écran', () => {
  it('borne la boîte, garde en-tête et boutons, fait défiler le corps', () => {
    render(
      <Modal title="Ajouter un appareil" onClose={() => {}} actions={<button type="button">Enregistrer</button>}>
        {Array.from({ length: 60 }, (_, i) => (
          <p key={i}>Ligne {i}</p>
        ))}
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toMatch(/max-h-\[calc\(100dvh-2rem\)\]/)
    expect(dialog.className).toMatch(/overflow-hidden/)

    const body = dialog.querySelector('[data-modal-body]') as HTMLElement
    expect(body).not.toBeNull()
    expect(body.className).toMatch(/overflow-y-auto/)
    expect(body.className).toMatch(/min-h-0/)
    expect(body.textContent).toContain('Ligne 59')

    const header = screen.getByRole('heading', { name: 'Ajouter un appareil' }).closest('div.shrink-0')
    expect(header).not.toBeNull()
    expect(body.contains(screen.getByRole('heading', { name: 'Ajouter un appareil' }))).toBe(false)

    const footer = screen.getByRole('button', { name: 'Enregistrer' }).parentElement as HTMLElement
    expect(footer.className).toMatch(/shrink-0/)
    expect(body.contains(footer)).toBe(false)
  })
})

describe('Modal : une saisie ne se perd pas par un clic à côté', () => {
  it('ferme sur un clic à côté tant que rien n’est rempli, plus ensuite', async () => {
    const { fireEvent } = await import('@testing-library/react')
    let closed = 0
    const { unmount } = render(
      <Modal title="Ajouter un appareil" onClose={() => (closed += 1)} actions={<button type="button">Enregistrer</button>}>
        <input aria-label="Nom" />
      </Modal>,
    )
    const backdrop = document.querySelector('button.absolute.inset-0') as HTMLElement
    fireEvent.click(backdrop)
    expect(closed).toBe(1)

    fireEvent.input(screen.getByLabelText('Nom'), { target: { value: 'Frigo' } })
    fireEvent.click(backdrop)
    expect(closed).toBe(1)
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' }).at(-1) as HTMLElement)
    expect(closed).toBe(2)
    unmount()
  })
})
