import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { FaqSection } from '@/pages/landing/sections/FaqSection'

function renderFaq() {
  render(
    <MemoryRouter>
      <FaqSection />
    </MemoryRouter>,
  )
  return screen.getAllByRole('button')
}

describe('FaqSection (accordéon)', () => {
  it('ouvre la première question au chargement, les autres sont fermées', () => {
    const buttons = renderFaq()
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true')
    buttons.slice(1).forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'false'))
  })

  it("n'ouvre qu'une seule réponse à la fois", () => {
    const buttons = renderFaq()
    fireEvent.click(buttons[2])
    expect(buttons[2]).toHaveAttribute('aria-expanded', 'true')
    expect(buttons.filter((b) => b.getAttribute('aria-expanded') === 'true')).toHaveLength(1)
  })

  it('referme la question ouverte quand on clique dessus', () => {
    const buttons = renderFaq()
    fireEvent.click(buttons[0])
    expect(buttons.filter((b) => b.getAttribute('aria-expanded') === 'true')).toHaveLength(0)
  })
})
