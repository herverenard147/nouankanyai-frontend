import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'

function Page() {
  const toggle = useUiStore((s) => s.toggleMobileDrawer)
  const open = useUiStore((s) => s.mobileDrawerOpen)
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls="mobile-drawer">Ouvrir</button>
      <MobileDrawer />
    </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('MobileDrawer : focus', () => {
  beforeEach(() => {
    useUiStore.setState({ mobileDrawerOpen: false })
    useSessionStore.setState({ session: { profile: 'menage', displayName: 'A', subtitle: 'B' } as never })
  })

  it('le focus entre dans le tiroir, Échap le ferme et rend le focus au déclencheur', () => {
    render(<Page />)
    const trigger = screen.getByRole('button', { name: 'Ouvrir' })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Navigation' })
    expect(dialog.id).toBe('mobile-drawer')
    expect(dialog.contains(document.activeElement)).toBe(true)
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('Tab boucle dans le tiroir', () => {
    render(<Page />)
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }))
    const dialog = screen.getByRole('dialog', { name: 'Navigation' })
    const items = dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    items[items.length - 1].focus()
    fireEvent.keyDown(items[items.length - 1], { key: 'Tab' })
    expect(document.activeElement).toBe(items[0])
    fireEvent.keyDown(items[0], { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(items[items.length - 1])
  })
})
