import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

/** Services coupés pour impayé : bandeau et lien vers le relevé (décision du propriétaire, 2026-10-19). */
vi.mock('@/api/rawBackend', () => ({ rawBilling: vi.fn() }))
import { rawBilling } from '@/api/rawBackend'
import { ServicesCutBanner } from '@/components/billing/ServicesCutBanner'

function show() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ServicesCutBanner />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Bandeau des services coupés', () => {
  it('dit pourquoi et mène au relevé', async () => {
    vi.mocked(rawBilling).mockResolvedValue({ services: { coupes: true, detail: 'Services suspendus : le relevé de 2026-09 est impayé.', releve_id: 'r1' } } as never)
    show()
    expect(await screen.findByText(/Services suspendus/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voir le relevé à régler' })).toHaveAttribute('href', '/app/facturation#releve-r1')
  })
  it('rien quand les services sont actifs', async () => {
    vi.mocked(rawBilling).mockResolvedValue({ services: { coupes: false, detail: null, releve_id: null } } as never)
    show()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
