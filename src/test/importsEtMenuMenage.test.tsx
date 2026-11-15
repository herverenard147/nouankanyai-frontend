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

const ROUTES_AVANT_2026_11_15 = {
  menage: [
    '/app/aide',
    '/app/alertes',
    '/app/apercu',
    '/app/boitier',
    '/app/conseils',
    '/app/consommation',
    '/app/equipements',
    '/app/facturation',
    '/app/factures',
    '/app/parametres',
    '/app/prediction',
    '/app/premiers-pas',
    '/app/rapports',
    '/app/recommandations',
  ],
  pme: [
    '/app/aide',
    '/app/alertes',
    '/app/apercu',
    '/app/audit',
    '/app/boitier',
    '/app/conseils',
    '/app/consommation',
    '/app/equipements',
    '/app/facturation',
    '/app/factures',
    '/app/parametres',
    '/app/plan-action',
    '/app/prediction',
    '/app/premiers-pas',
    '/app/rapports',
    '/app/recommandations',
    '/app/sources',
  ],
  industrie: [
    '/app/aide',
    '/app/alertes',
    '/app/apercu',
    '/app/audit',
    '/app/conseils',
    '/app/consommation',
    '/app/facturation',
    '/app/factures',
    '/app/journal',
    '/app/machines',
    '/app/parametres',
    '/app/plan-action',
    '/app/prediction',
    '/app/premiers-pas',
    '/app/rapports',
    '/app/recommandations',
    '/app/sources',
  ],
  admin: [
    '/app/admin/boitiers',
    '/app/admin/donnees',
    '/app/admin/facturation',
    '/app/admin/leads',
    '/app/admin/messages',
    '/app/admin/modeles',
    '/app/admin/prix-materiel',
    '/app/admin/sante',
    '/app/admin/utilisateurs',
    '/app/aide',
    '/app/alertes',
    '/app/apercu',
    '/app/audit',
    '/app/consommation',
    '/app/journal',
    '/app/parametres',
    '/app/prediction',
    '/app/premiers-pas',
  ],
} as const

describe('menus resserrés (audit S-14, 2026-11-15)', () => {
  it('Ménage : huit entrées ; Abonnement et Facture prévue, mis dans le menu le 2026-10-21, sont rangés sous leur page parente (décision du 2026-11-15)', () => {
    expect(visibleNav('menage').map((entry) => entry.label)).toEqual([
      'Accueil', 'Mes appareils', 'Ma consommation', 'Mes factures', 'Conseils', 'À surveiller', 'Paramètres', 'Documentation',
    ])
  })
  it('Industrie : neuf entrées', () => {
    expect(visibleNav('industrie').map((entry) => entry.label)).toEqual([
      "Vue d'ensemble", 'Alertes', 'Machines', 'Conso & coûts', 'Conseils', 'Factures CIE', 'Sources de mesures', 'Paramètres', 'Documentation',
    ])
  })
  it('PME : neuf entrées', () => {
    expect(visibleNav('pme').map((entry) => entry.label)).toEqual([
      "Vue d'ensemble", 'Alertes', 'Équipements', 'Conso & coûts', 'Conseils', 'Factures CIE', 'Sources de mesures', 'Paramètres', 'Documentation',
    ])
  })
  it('Admin : dix entrées', () => {
    expect(visibleNav('admin').map((entry) => entry.label)).toEqual([
      "Vue d'ensemble", 'Alertes', 'Conso & coûts', 'Santé plateforme', 'Utilisateurs', 'Impayés et abonnements', "Demandes d'audit", 'Journal', 'Paramètres', 'Documentation',
    ])
  })
  it('aucun menu visible ne dépasse dix entrées', () => {
    for (const profile of ['menage', 'pme', 'industrie', 'admin', 'technicien'] as const) {
      expect(visibleNav(profile).length, profile).toBeLessThanOrEqual(10)
    }
  })
  it('aucune fonction supprimée : chaque route d\'avant reste autorisée, et chaque page rangée dépend d\'une entrée visible', () => {
    for (const profile of ['menage', 'pme', 'industrie', 'admin'] as const) {
      const paths = NAV_BY_PROFILE[profile].map((entry) => entry.path).sort()
      expect(paths, profile).toEqual([...ROUTES_AVANT_2026_11_15[profile]])
      const shown = visibleNav(profile).map((entry) => entry.path)
      for (const entry of NAV_BY_PROFILE[profile].filter((e) => e.under)) {
        expect(isRouteAllowed(entry.path, profile), `${profile} ${entry.path}`).toBe(true)
        expect(shown, `${profile} ${entry.path}`).toContain(entry.under)
      }
      expect(NAV_BY_PROFILE[profile][0].path).toBe('/app/apercu')
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
