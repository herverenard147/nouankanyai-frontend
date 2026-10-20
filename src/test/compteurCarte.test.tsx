import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Compteur à carte : recharges, crédit restant, prix réel, chiffre lu sur le compteur (décision du propriétaire, 2026-10-20). */
vi.mock('@/api/rawBackend', () => ({
  rawPrepaid: vi.fn(),
  rawAddRecharge: vi.fn(),
  rawDeleteRecharge: vi.fn(),
  rawSetPrepaidReading: vi.fn(),
  rawUploadRechargePhoto: vi.fn(),
}))

import { rawAddRecharge, rawDeleteRecharge, rawPrepaid, rawSetPrepaidReading, rawUploadRechargePhoto } from '@/api/rawBackend'
import { PrepaidSection } from '@/components/billing/PrepaidSection'
import { ApiError } from '@/lib/apiClient'
import type { BackendPrepaid } from '@/types/backend'

const meter: BackendPrepaid = {
  site_id: 's1',
  nom: 'Maison',
  credit: { kwh: 12, jours: 1.2, epuise_le: '2026-10-22T08:00:00', rythme_kwh_jour: 9.75, source_rythme: 'recharges', reference: 'releve', reference_le: '2026-10-20T20:00:00' },
  bientot_epuise: true,
  releve: { kwh: 12, le: '2026-10-20T20:00:00' },
  prix_kwh_reel: 125,
  recharges: [
    { id: 'r2', site_id: 's1', date: '2026-10-18T12:00:00', montant_fcfa: 5000, kwh: 41, prix_kwh: 122, source: 'photo' },
    { id: 'r1', site_id: 's1', date: '2026-10-14T12:00:00', montant_fcfa: 5000, kwh: 39, prix_kwh: 128.2, source: 'manuel' },
  ],
}

function show() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PrepaidSection />
    </QueryClientProvider>,
  )
}

describe('compteur à carte', () => {
  afterEach(() => vi.clearAllMocks())

  it('rien sans compteur à carte', async () => {
    vi.mocked(rawPrepaid).mockResolvedValue([])
    show()
    await waitFor(() => expect(rawPrepaid).toHaveBeenCalled())
    expect(screen.queryByRole('heading', { name: /Compteur à carte/ })).toBeNull()
  })

  it('crédit restant, date limite, rythme, prix réel et recharges', async () => {
    vi.mocked(rawPrepaid).mockResolvedValue([meter])
    show()
    expect(await screen.findByRole('heading', { name: 'Compteur à carte : Maison' })).toBeTruthy()
    expect(screen.getByText(/≈ 12\s*kWh/)).toBeTruthy()
    expect(screen.getByText(/rechargez avant le jeudi 22\/10/)).toBeTruthy()
    expect(screen.getByText(/9,8\s*kWh par jour, d’après vos recharges/)).toBeTruthy()
    expect(screen.getByText(/125\s*FCFA le kWh/)).toBeTruthy()
    expect(screen.getByText('Lue sur le reçu')).toBeTruthy()
    expect(document.getElementById('prepaye-s1')).toBeTruthy()
  })

  it('ajouter une recharge à la main', async () => {
    vi.mocked(rawPrepaid).mockResolvedValue([meter])
    vi.mocked(rawAddRecharge).mockResolvedValue(meter.recharges[0])
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter une recharge' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    fireEvent.change(within(dialog).getByLabelText(/Montant payé/), { target: { value: '5 000' } })
    fireEvent.change(within(dialog).getByLabelText(/kWh obtenus/), { target: { value: '39,5' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(rawAddRecharge).toHaveBeenCalled())
    expect(vi.mocked(rawAddRecharge).mock.calls[0][0]).toMatchObject({ site_id: 's1', montant_fcfa: 5000, kwh: 39.5 })
  })

  it('chiffre lu sur le compteur, suppression confirmée, photo illisible', async () => {
    vi.mocked(rawPrepaid).mockResolvedValue([meter])
    vi.mocked(rawSetPrepaidReading).mockResolvedValue(meter)
    vi.mocked(rawDeleteRecharge).mockResolvedValue(null)
    vi.mocked(rawUploadRechargePhoto).mockRejectedValue(new ApiError('Ce reçu n’a pas pu être lu : saisissez la recharge à la main.', 422))
    show()
    fireEvent.click(await screen.findByRole('button', { name: 'J’ai lu mon compteur' }))
    let dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText(/Crédit affiché/), { target: { value: '20' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(rawSetPrepaidReading).toHaveBeenCalledWith('s1', 20))

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la recharge du 18/10/2026' }))
    dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Supprimer la recharge' }))
    await waitFor(() => expect(rawDeleteRecharge).toHaveBeenCalled())
    expect(vi.mocked(rawDeleteRecharge).mock.calls[0][0]).toBe('r2')

    const input = screen.getByLabelText('Photo du reçu de recharge pour Maison')
    fireEvent.change(input, { target: { files: [new File(['x'], 'recu.png', { type: 'image/png' })] } })
    expect(await screen.findByText(/saisissez la recharge à la main/)).toBeTruthy()
  })
})
