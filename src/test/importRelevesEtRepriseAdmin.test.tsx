import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BulkReadingsImport } from '@/components/import/BulkReadingsImport'
import { TransferCard } from '@/components/import/TransferCard'

const api = vi.hoisted(() => ({
  downloadReadingTemplate: vi.fn(),
  previewReadingImport: vi.fn(),
  confirmReadingImport: vi.fn(),
  previewTransfer: vi.fn(),
  confirmTransfer: vi.fn(),
}))
vi.mock('@/api/dataImport', () => api)

const wrap = (node: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{node}</QueryClientProvider>)
const file = (name: string) => new File(['x'], name)

beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()))

describe('import de relevés en lot', () => {
  it('aperçu par appareil, lignes refusées, puis import du même fichier après confirmation', async () => {
    api.previewReadingImport.mockResolvedValue({
      acceptes: 2, refuses: 1,
      appareils: [{ code: 'NEW-1', nom: 'Compresseur', releves: 2, du: '2025-03-01T08:00:00', au: '2025-03-02T09:00:00' }],
      rejected: [{ line: 5, raison: 'appareil « AUTRE » inconnu sur ce compte' }],
    })
    api.confirmReadingImport.mockResolvedValue({ imported: 2, refuses: 1 })
    wrap(<BulkReadingsImport />)
    const chosen = file('releves.csv')
    fireEvent.change(screen.getByLabelText('Fichier de relevés à importer'), { target: { files: [chosen] } })
    expect(await screen.findByText('Aperçu de l’import')).toBeTruthy()
    expect(screen.getByText(/2 relevés, du 01\/03\/2025 au 02\/03\/2025/)).toBeTruthy()
    expect(screen.getByText(/Ligne 5 : appareil « AUTRE » inconnu/)).toBeTruthy()
    expect(api.confirmReadingImport).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Importer 2 relevés' }))
    await waitFor(() => expect(api.confirmReadingImport.mock.calls[0][0]).toBe(chosen))
    expect(await screen.findByText('Relevés importés')).toBeTruthy()
    expect(screen.getByText(/ce sont vos valeurs, pas des mesures du boîtier/)).toBeTruthy()
  })
  it('rien d’acceptable : import impossible', async () => {
    api.previewReadingImport.mockResolvedValue({ acceptes: 0, refuses: 3, appareils: [], rejected: [{ line: 2, raison: 'date illisible' }] })
    wrap(<BulkReadingsImport />)
    fireEvent.change(screen.getByLabelText('Fichier de relevés à importer'), { target: { files: [file('r.csv')] } })
    expect(((await screen.findByRole('button', { name: 'Importer 0 relevé' })) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('reprise d’un export par le support', () => {
  it('l’aperçu et la reprise visent le compte du client', async () => {
    const preview = { source: { type_compte: 'PME', exporte_le: '2026-10-11T18:00:00' }, sites: { a_creer: 1, deja_presents: 0 }, appareils: 2, releves: 6, factures: { a_importer: 1, ignorees: [] }, blocage: null }
    api.previewTransfer.mockResolvedValue(preview)
    api.confirmTransfer.mockResolvedValue({ sites: 1, appareils: 2, releves: 6, factures: 1, factures_ignorees: [] })
    wrap(<TransferCard targetUserId="client-42" targetName="Boulangerie Awalé" />)
    expect(screen.getByText('Reprendre un export dans ce compte')).toBeTruthy()
    expect(screen.getByText(/ajoutées au compte de Boulangerie Awalé/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Archive d'export à reprendre"), { target: { files: [file('export.zip')] } })
    await waitFor(() => expect(api.previewTransfer.mock.calls[0][2]).toBe('client-42'))
    fireEvent.click(await screen.findByRole('button', { name: 'Reprendre ces données' }))
    await waitFor(() => expect(api.confirmTransfer.mock.calls[0][2]).toBe('client-42'))
  })
})
