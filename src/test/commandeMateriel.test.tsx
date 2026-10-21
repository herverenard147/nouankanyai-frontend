import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/** Commande du matériel avec son prix détaillé (demande du propriétaire, 2026-10-21). */
const requestMock = vi.fn(() => Promise.resolve({}))
vi.mock('@/hooks/queries/useSites', () => ({ useSites: () => ({ isSuccess: true, data: [{ id: 's1', nom: 'Maison', localisation: '', user_id: 'u' }] }) }))
vi.mock('@/hooks/queries/useBoitiers', () => ({
  useBoitierMutations: () => ({ request: { mutateAsync: requestMock } }),
  useBoitierPrice: () => ({
    data: {
      unit_price_fcfa: 170000,
      currency: 'FCFA',
      materiels: [
        { kind: 'vocal', nom: 'Boîtier qui parle', description: 'Pour la maison', prix_fcfa: 170000, lignes: [{ libelle: 'Raspberry Pi 4 (4 Go)', fcfa: 62000, groupe: 'materiel' }], non_compris: [] },
        { kind: 'capteur', nom: 'Capteur d’un appareil', description: 'Mesure un appareil', prix_fcfa: 55000, lignes: [{ libelle: 'Pose par un électricien (230 V)', fcfa: 10000, groupe: 'frais' }], non_compris: [] },
        { kind: 'passerelle', nom: 'Passerelle de mesure', description: 'Dans le tableau', prix_fcfa: 64000, lignes: [], non_compris: ['Les compteurs Modbus'] },
      ],
    },
  }),
}))

import { RequestBoitierModal } from '@/components/boitier/RequestBoitierModal'

describe('commander du matériel', () => {
  it('choix du matériel, prix détaillé, et le matériel part avec la demande', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RequestBoitierModal profile="menage" onClose={() => {}} />
      </QueryClientProvider>,
    )
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Commander du matériel')).toBeTruthy()
    fireEvent.click(within(dialog).getByLabelText(/Capteur d’un appareil/))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Voir le détail du prix' }))
    expect(within(dialog).getByText('Pose par un électricien (230 V)')).toBeTruthy()
    expect(within(dialog).getAllByText(/55\s?000\s?FCFA/).length).toBeGreaterThan(0)
    fireEvent.change(within(dialog).getByLabelText(/Contact pour la livraison/), { target: { value: '07 00 00 00 00' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Envoyer la demande' }))
    await waitFor(() => expect(requestMock).toHaveBeenCalled())
    expect((requestMock.mock.calls[0] as unknown[])[0]).toMatchObject({ kind: 'capteur', site_id: 's1' })
  })
})
