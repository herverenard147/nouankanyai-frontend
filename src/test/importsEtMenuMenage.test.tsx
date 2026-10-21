import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import { BulkInvoiceImport } from '@/components/import/BulkInvoiceImport'
import { TransferCard } from '@/components/import/TransferCard'
import { UploadCard } from '@/components/upload/UploadCard'
import { NAV_BY_PROFILE, isRouteAllowed, visibleNav } from '@/lib/navConfig'

const api = vi.hoisted(() => ({
  downloadBillTemplate: vi.fn(),
  previewBillImport: vi.fn(),
  confirmBillImport: vi.fn(),
  previewTransfer: vi.fn(),
  confirmTransfer: vi.fn(),
}))
vi.mock('@/api/dataImport', () => api)

function wrap(node: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>{node}</QueryClientProvider>)
}

const file = (name: string) => new File(['x'], name)

beforeEach(() => Object.values(api).forEach((mock) => mock.mockReset()))

describe('menu resserré du Ménage (partie H2)', () => {
  it('entrées au vocabulaire du quotidien, Documentation (2026-10-16) et Abonnement (2026-10-21), sans Prédiction, Rapports ni Recommandations', () => {
    expect(visibleNav('menage').map((entry) => entry.label)).toEqual([
      'Accueil', 'Premiers pas', 'Mes appareils', 'Ma consommation', 'Mes factures', 'Abonnement', 'Conseils', 'À surveiller', 'Mon boîtier', 'Paramètres', 'Documentation',
    ])
  })
  it('aucune fonction supprimée : les pages retirées du menu restent accessibles et rattachées à une entrée visible', () => {
    const shown = visibleNav('menage').map((entry) => entry.path)
    for (const path of ['/app/prediction', '/app/rapports', '/app/recommandations']) {
      expect(isRouteAllowed(path, 'menage'), path).toBe(true)
      expect(shown).toContain(NAV_BY_PROFILE.menage.find((entry) => entry.path === path)?.under)
    }
  })
  it('PME, Industrie et Admin gardent leur menu complet', () => {
    for (const profile of ['pme', 'industrie', 'admin'] as const) {
      expect(visibleNav(profile)).toEqual(NAV_BY_PROFILE[profile])
      expect(NAV_BY_PROFILE[profile][0].label).toBe("Vue d'ensemble")
    }
  })
})

describe('facture en PDF (partie I1)', () => {
  it('la facture accepte une photo ou un PDF, sans forcer l’appareil photo', () => {
    const { container } = render(<UploadCard title="t" caption="c" onFileSelected={() => {}} isUploading={false} accept="image/*,application/pdf" camera={false} />)
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    expect(input.accept).toBe('image/*,application/pdf')
    expect(input.hasAttribute('capture')).toBe(false)
  })
  it('par défaut : photo prise avec l’appareil (ajout d’un appareil)', () => {
    const { container } = render(<UploadCard title="t" caption="c" onFileSelected={() => {}} isUploading={false} />)
    const input = container.querySelector('input[type=file]') as HTMLInputElement
    expect(input.accept).toBe('image/*')
    expect(input.getAttribute('capture')).toBe('environment')
  })
})

describe('import de factures en lot (partie I2)', () => {
  it('montre l’aperçu avec les lignes refusées, et n’enregistre qu’après confirmation', async () => {
    const rows = [{ line: 2, month: '2031-01', amount_xof: 45000, kwh_consumed: 520, period_months: 1 }]
    api.previewBillImport.mockResolvedValue({ rows, rejected: [{ line: 3, raison: 'mois illisible (exemple : 2026-09)' }] })
    api.confirmBillImport.mockResolvedValue({ imported: 1 })
    wrap(<BulkInvoiceImport profile="pme" />)
    fireEvent.change(screen.getByLabelText('Fichier de factures à importer'), { target: { files: [file('f.csv')] } })
    expect(await screen.findByText('Aperçu de l’import')).toBeTruthy()
    expect(screen.getByText(/Ligne 3 : mois illisible/)).toBeTruthy()
    expect(api.confirmBillImport).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Importer 1 facture' }))
    await waitFor(() => expect(api.confirmBillImport.mock.calls[0][0]).toEqual(rows))
    expect(await screen.findByText('Factures importées')).toBeTruthy()
  })
  it('aucune ligne acceptable : le bouton d’import est désactivé', async () => {
    api.previewBillImport.mockResolvedValue({ rows: [], rejected: [{ line: 2, raison: 'montant absent' }] })
    wrap(<BulkInvoiceImport profile="menage" />)
    fireEvent.change(screen.getByLabelText('Fichier de factures à importer'), { target: { files: [file('f.csv')] } })
    const button = (await screen.findByRole('button', { name: 'Importer 0 facture' })) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })
})

describe('reprise de l’export d’un autre compte (partie I4)', () => {
  const preview = {
    source: { type_compte: 'PME', exporte_le: '2026-10-11T18:00:00' },
    sites: { a_creer: 1, deja_presents: 0 }, appareils: 2, releves: 6,
    factures: { a_importer: 1, ignorees: [] }, blocage: null,
  }

  it('aperçu, choix de ce qui est repris, puis confirmation', async () => {
    api.previewTransfer.mockResolvedValue(preview)
    api.confirmTransfer.mockResolvedValue({ sites: 1, appareils: 0, releves: 0, factures: 1, factures_ignorees: [] })
    wrap(<TransferCard />)
    fireEvent.change(screen.getByLabelText("Archive d'export à reprendre"), { target: { files: [file('export.zip')] } })
    expect(await screen.findByText('Aperçu de la reprise')).toBeTruthy()
    // Sans les appareils, les relevés ne sont plus repris non plus.
    fireEvent.click(screen.getByRole('checkbox', { name: /Appareils/ }))
    await waitFor(() => expect(api.previewTransfer.mock.calls.at(-1)?.[1]).toEqual(['sites', 'factures']))
    await waitFor(() => expect((screen.getByRole('button', { name: 'Reprendre ces données' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre ces données' }))
    await waitFor(() => expect(api.confirmTransfer.mock.calls[0][1]).toEqual(['sites', 'factures']))
    expect(await screen.findByText('Données reprises')).toBeTruthy()
  })
  it('formule dépassée : le blocage est expliqué et la reprise impossible', async () => {
    api.previewTransfer.mockResolvedValue({ ...preview, blocage: 'Votre abonnement permet 1 appareils au maximum.' })
    wrap(<TransferCard />)
    fireEvent.change(screen.getByLabelText("Archive d'export à reprendre"), { target: { files: [file('export.zip')] } })
    expect(await screen.findByText(/Votre abonnement permet 1 appareils/)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Reprendre ces données' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
