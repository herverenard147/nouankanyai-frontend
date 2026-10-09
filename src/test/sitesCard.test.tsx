import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/queries/useSites', () => ({
  useSites: () => ({ status: 'success', data: [{ id: 's1', nom: 'Atelier', localisation: 'Abidjan', user_id: 'u' }] }),
  useCreateSite: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null }),
  useDeleteSite: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null }),
}))
vi.mock('@/hooks/queries/useBoitiers', () => ({
  useBoitiers: () => ({
    data: [
      { device: { id: 'd1', nom: 'Boîtier atelier', scope: 'site', site_id: 's1' } },
      { device: { id: 'd2', nom: 'Boîtier du compte', scope: 'account', site_id: null } },
    ],
  }),
}))

import { SitesCard } from '@/components/settings/SitesCard'

describe('suppression d’un site', () => {
  it('le modal de validation nomme le boîtier qui sera déconnecté, et lui seul', () => {
    render(<SitesCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le site Atelier' }))
    expect(screen.getByText(/Le boîtier « Boîtier atelier » sera déconnecté/)).toBeTruthy()
    expect(screen.queryByText(/Boîtier du compte/)).toBeNull()
  })
})
