import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/** Numéro de compteur CIE verrouillé (décision du propriétaire, 2026-10-19). */
vi.mock('@/api/rawBackend', () => ({
  rawCompteur: vi.fn(),
  rawSetCompteur: vi.fn().mockResolvedValue({}),
  rawRequestCompteurChange: vi.fn().mockResolvedValue({}),
}))
import { rawCompteur, rawRequestCompteurChange, rawSetCompteur } from '@/api/rawBackend'
import { CompteurCard } from '@/components/settings/CompteurCard'

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CompteurCard />
    </QueryClientProvider>,
  )
}

describe('Numéro de compteur CIE', () => {
  it('saisi une fois, après confirmation', async () => {
    vi.mocked(rawCompteur).mockResolvedValue({ numero: null, source: null, fixe_le: null, verrouille: false, demande: null })
    show()
    fireEvent.change(await screen.findByLabelText(/Numéro de compteur/), { target: { value: '453715992323' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Enregistrer et verrouiller' }))
    await waitFor(() => expect(rawSetCompteur).toHaveBeenCalledWith('453715992323'))
  })

  it('verrouillé : changement seulement par une demande avec photo', async () => {
    vi.mocked(rawCompteur).mockResolvedValue({ numero: '453715992323', source: 'facture', fixe_le: null, verrouille: true, demande: null })
    show()
    expect(await screen.findByText('453715992323')).toBeTruthy()
    expect(screen.queryByLabelText(/^Numéro de compteur/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Demander un changement' }))
    const envoyer = screen.getByRole('button', { name: 'Envoyer la demande' }) as HTMLButtonElement
    expect(envoyer.disabled).toBe(true)                                   // pas de photo, pas de demande
    fireEvent.change(screen.getByLabelText(/Nouveau numéro/), { target: { value: '999999999' } })
    const file = new File(['x'], 'facture.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/Photo d’une facture/), { target: { files: [file] } })
    fireEvent.submit(screen.getByLabelText(/Nouveau numéro/).closest('form') as HTMLFormElement)   // bouton relié par « form= »
    await waitFor(() => expect(rawRequestCompteurChange).toHaveBeenCalledWith('999999999', '', file))
  })
})
