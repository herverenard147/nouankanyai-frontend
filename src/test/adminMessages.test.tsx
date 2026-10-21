import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/** Test du site (2026-10-18, constat 58) : messages paginés, « traité », suppression des seuls messages exportés. */
vi.mock('@/api/rawBackend', () => ({
  rawContactMessages: vi.fn(),
  rawMarkContactMessage: vi.fn().mockResolvedValue({}),
  rawMarkContactMessages: vi.fn().mockResolvedValue({ modifies: 2 }),
  rawDeleteContactMessagesByIds: vi.fn().mockResolvedValue({ supprimes: 1 }),
  rawDeleteExportedContactMessages: vi.fn().mockResolvedValue({ supprimes: 2 }),
  rawDeleteSpamMessages: vi.fn().mockResolvedValue({ supprimes: 120 }),
  downloadContactCsv: vi.fn().mockResolvedValue(undefined),
  rawWaitlistEntries: vi.fn().mockResolvedValue([]),
}))
import {
  rawContactMessages,
  rawDeleteContactMessagesByIds,
  rawDeleteExportedContactMessages,
  rawDeleteSpamMessages,
  rawMarkContactMessage,
  rawMarkContactMessages,
} from '@/api/rawBackend'
import { AdminMessagesPage } from '@/pages/app/admin/AdminMessagesPage'

function page() {
  vi.mocked(rawContactMessages).mockResolvedValue({
    items: [
      { id: 'm1', nom: 'x', email: 'x@x.com', message: 'test', created_at: '2026-08-29T10:00:00', handled_at: null, exported_at: null },
      { id: 'm2', nom: 'y', email: 'y@x.com', message: 'test', created_at: '2026-08-29T10:00:00', handled_at: null, exported_at: null },
    ],
    total: 120,
    page: 1,
    per_page: 50,
  })
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <AdminMessagesPage />
    </QueryClientProvider>,
  )
}

describe('Messages de contact (admin)', () => {
  it('paginé, filtré « à traiter » par défaut, marquer traité', async () => {
    page()
    await waitFor(() => expect(screen.getByText(/120 messages, page 1 sur 3/)).toBeTruthy())
    expect(vi.mocked(rawContactMessages)).toHaveBeenCalledWith('a_traiter', '', 1, 50)
    fireEvent.click(screen.getAllByRole('button', { name: 'Marquer traité' })[0])
    await waitFor(() => expect(rawMarkContactMessage).toHaveBeenCalledWith('m1', true))
    fireEvent.click(screen.getByRole('button', { name: 'Suivante' }))
    await waitFor(() => expect(vi.mocked(rawContactMessages)).toHaveBeenCalledWith('a_traiter', '', 2, 50))
  })

  it('la suppression demande une confirmation et ne vise que les messages exportés', async () => {
    page()
    await waitFor(() => expect(screen.getByText(/120 messages/)).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer les messages exportés' }))
    expect(screen.getByText(/Seuls les messages déjà exportés sont supprimés/)).toBeTruthy()
    expect(rawDeleteExportedContactMessages).not.toHaveBeenCalled()
    const buttons = screen.getAllByRole('button', { name: 'Supprimer les messages exportés' })
    fireEvent.click(buttons[buttons.length - 1])
    await waitFor(() => expect(rawDeleteExportedContactMessages).toHaveBeenCalledWith(''))
  })

  it('« Supprimer comme spam » : seulement sur une recherche, sans export, nombre à retaper', async () => {
    page()
    await waitFor(() => expect(screen.getByText(/120 messages/)).toBeTruthy())
    expect((screen.getByRole('button', { name: 'Supprimer comme spam' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Rechercher/), { target: { value: 'x@x.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Rechercher' }))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Supprimer comme spam' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer comme spam' }))
    const field = await screen.findByLabelText(/tapez le nombre de messages/)
    const buttons = () => screen.getAllByRole('button', { name: 'Supprimer comme spam' })
    expect((buttons()[buttons().length - 1] as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(field, { target: { value: '120' } })
    fireEvent.click(buttons()[buttons().length - 1])
    await waitFor(() => expect(rawDeleteSpamMessages).toHaveBeenCalledWith('x@x.com', 120))
  })

  it('plusieurs messages cochés : traités ensemble, ou supprimés après confirmation (test du 2026-10-21)', async () => {
    page()
    await waitFor(() => expect(screen.getByText(/120 messages/)).toBeTruthy())
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cocher tous les messages de la page' }))
    expect(screen.getByText('2 messages cochés')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Marquer traités' }))
    await waitFor(() => expect(rawMarkContactMessages).toHaveBeenCalledWith(['m1', 'm2'], true))
    await waitFor(() => expect(screen.queryByText(/cochés?$/)).toBeNull())
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cocher le message de y' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer les cochés' }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer les messages cochés' }))
    await waitFor(() => expect(rawDeleteContactMessagesByIds).toHaveBeenCalledWith(['m2']))
  })
})
