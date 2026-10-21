import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

/** Justificatif zoomable, demande de justificatif et rejet motivé (demande du propriétaire, 2026-10-21). */
vi.mock('@/api/rawBackend', async (orig) => ({
  ...(await orig<typeof import('@/api/rawBackend')>()),
  rawAdminPendingBills: vi.fn(),
  rawAdminBillPhoto: vi.fn().mockResolvedValue({ photo_data_url: 'data:image/png;base64,AAAA' }),
  rawAdminValidateBill: vi.fn().mockResolvedValue({}),
  rawAdminRequestProof: vi.fn().mockResolvedValue({}),
  rawAdminCompteurDemandes: vi.fn().mockResolvedValue([]),
  rawAdminUnpaid: vi.fn().mockResolvedValue([]),
  rawAdminTierRequests: vi.fn().mockResolvedValue([]),
}))

import * as raw from '@/api/rawBackend'
import { ZoomableImage } from '@/components/ui/ZoomableImage'
import { AdminBillingPage } from '@/pages/app/admin/AdminBillingPage'

const bill = {
  id: 'b1', month: '2026-09', period_months: 1, kwh_consumed: 1000, amount_xof: 90000, source: 'manuel', document_type: null,
  has_photo: true, validation_status: 'en_attente', user_id: 'u1', user_nom: 'Awa', user_email: 'a@x.ci', verification: null,
  compteur_cie: 'C1', justificatif_demande_at: null, justificatif_demande_motif: null, justificatif_limite: null, motif_refus: null,
}

function page() {
  vi.mocked(raw.rawAdminPendingBills).mockResolvedValue([bill] as never)
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <AdminBillingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('justificatif des factures', () => {
  it('zoom de 100 à 400 %', () => {
    render(<ZoomableImage src="data:image/png;base64,AAAA" alt="Facture" />)
    expect(screen.getByText('100 %')).toBeTruthy()
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole('button', { name: 'Agrandir' }))
    expect(screen.getByText('400 %')).toBeTruthy()
    expect((screen.getByAltText('Facture') as HTMLImageElement).style.width).toBe('400%')
    fireEvent.click(screen.getByRole('button', { name: 'Taille d’origine' }))
    expect(screen.getByText('100 %')).toBeTruthy()
  })

  it('demander le justificatif : motif obligatoire, puis envoi', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Demander le justificatif' }))
    const dialog = screen.getByRole('dialog')
    const send = within(dialog).getByRole('button', { name: 'Envoyer la demande' })
    expect((send as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(within(dialog).getByLabelText(/Ce qui manque/), { target: { value: 'Photo de la facture complète' } })
    fireEvent.click(send)
    await waitFor(() => expect(raw.rawAdminRequestProof).toHaveBeenCalledWith('b1', 'Photo de la facture complète'))
  })

  it('rejeter demande un motif, transmis au serveur', async () => {
    page()
    fireEvent.click(await screen.findByRole('button', { name: 'Rejeter' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Motif du refus/), { target: { value: 'Photo illisible' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Rejeter' }))
    await waitFor(() => expect(raw.rawAdminValidateBill).toHaveBeenCalledWith('b1', 'rejetee', undefined, 'Photo illisible'))
  })
})
