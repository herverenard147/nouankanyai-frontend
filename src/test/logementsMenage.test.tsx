import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Logements du ménage selon l'abonnement, type de compteur et calibre (décision du propriétaire, 2026-10-20). */
vi.mock('@/api/rawBackend', () => ({
  rawSites: vi.fn(),
  rawCreateSite: vi.fn(),
  rawDeleteSite: vi.fn(),
  rawRenameSite: vi.fn(),
  rawSetSiteMeter: vi.fn(),
  rawSetBreaker: vi.fn(),
  rawSetSiteSubscription: vi.fn(),
}))

import { rawCreateSite, rawRenameSite, rawSetBreaker, rawSetSiteMeter, rawSites } from '@/api/rawBackend'
import { breakerAmperes, LogementsCard } from '@/components/settings/LogementsCard'
import { ApiError } from '@/lib/apiClient'
import type { BackendSite } from '@/types/backend'

const maison: BackendSite = { id: 's1', nom: 'Maison', localisation: '', user_id: 'u', souscription_valeur: 6.6, souscription_unite: 'kVA', compteur_type: 'prepaye' }

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <LogementsCard />
    </QueryClientProvider>,
  )
}

describe('logements du ménage', () => {
  afterEach(() => vi.clearAllMocks())

  it('calibre en ampères, saisi en A ou tiré des kVA', () => {
    expect(breakerAmperes({ souscription_valeur: 30, souscription_unite: 'A' })).toBe(30)
    expect(breakerAmperes({ souscription_valeur: 6.6, souscription_unite: 'kVA' })).toBe(30)
    expect(breakerAmperes({ souscription_valeur: 250, souscription_unite: 'kW' })).toBeNull()
    expect(breakerAmperes({ souscription_valeur: null, souscription_unite: null })).toBeNull()
  })

  it('liste : type de compteur et calibre', async () => {
    vi.mocked(rawSites).mockResolvedValue([maison])
    show()
    expect(await screen.findByText('Maison')).toBeTruthy()
    expect(screen.getByText(/Compteur à carte \(je recharge\)/)).toBeTruthy()
    expect(screen.getByText('30 A')).toBeTruthy()
  })

  it('ajout : nom et type de compteur ; le refus de l’abonnement est affiché', async () => {
    vi.mocked(rawSites).mockResolvedValue([maison])
    vi.mocked(rawCreateSite).mockRejectedValue(new ApiError('Votre abonnement permet 1 logement au maximum.', 402))
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter un logement' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Nom/), { target: { value: 'Boutique' } })
    fireEvent.click(within(dialog).getByLabelText(/Compteur à carte/))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(vi.mocked(rawCreateSite).mock.calls[0]?.[0]).toEqual({ nom: 'Boutique', compteur_type: 'prepaye' }))
    expect(await within(dialog).findByText(/1 logement au maximum/)).toBeTruthy()
  })

  it('modification : nom, compteur et calibre en une validation', async () => {
    vi.mocked(rawSites).mockResolvedValue([maison])
    vi.mocked(rawRenameSite).mockResolvedValue(maison)
    vi.mocked(rawSetSiteMeter).mockResolvedValue(maison)
    vi.mocked(rawSetBreaker).mockResolvedValue({ site_id: 's1', amperes: 15 })
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Modifier le logement Maison' }))
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/^Nom/), { target: { value: 'Maison Cocody' } })
    fireEvent.click(within(dialog).getByLabelText(/Compteur à facture/))
    fireEvent.change(within(dialog).getByLabelText(/Calibre du disjoncteur/), { target: { value: '15' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(rawSetBreaker).toHaveBeenCalledWith(15, 's1'))
    expect(rawRenameSite).toHaveBeenCalledWith('s1', 'Maison Cocody')
    expect(rawSetSiteMeter).toHaveBeenCalledWith('s1', 'postpaye')
  })
})
