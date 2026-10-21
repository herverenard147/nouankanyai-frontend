import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/** Page « Prix du matériel » de l'administrateur (demande du propriétaire, 2026-10-21). */
vi.mock('@/api/rawBackend', () => ({ rawAdminPricing: vi.fn(), rawAdminSavePricing: vi.fn(), rawAdminResetPricing: vi.fn() }))

import { rawAdminPricing, rawAdminSavePricing } from '@/api/rawBackend'
import { AdminPricingPage, configValid, priceOf } from '@/pages/app/admin/AdminPricingPage'
import type { BackendPricingView, PricingConfig } from '@/types/backend'

const kind = (nom: string, composants: number[], frais: number[]) => ({
  nom, description: 'd', composants: composants.map((fcfa, i) => ({ libelle: `C${i}`, fcfa })), frais: frais.map((fcfa, i) => ({ libelle: `F${i}`, fcfa })), non_compris: [],
})
const config: PricingConfig = {
  import_rate: 0.25,
  margin_rate: 0.2,
  kinds: { vocal: kind('Boîtier qui parle', [62000, 16000, 5000, 5000, 8000, 5000], [7500, 3000, 5000]), capteur: kind('Capteur', [4000, 10000, 1500, 3000, 2500, 3000], [3000, 3000, 10000]), passerelle: kind('Passerelle', [4000, 3000, 8000, 4000, 3000], [3000, 3000, 20000]) },
}

describe('prix du matériel', () => {
  it('même calcul que le serveur, arrondi à 500 FCFA au-dessus pour une moitié', () => {
    // Valeurs du serveur (app/boitier/pricing.py) : 170 500, 55 000, 64 000.
    expect(priceOf(config, 'vocal').total).toBe(170500)
    expect(priceOf(config, 'capteur').total).toBe(55000)
    expect(priceOf(config, 'passerelle').total).toBe(64000)
    const p = priceOf(config, 'capteur')
    expect(p.hardware + p.importFee + 16000 + p.margin).toBe(p.total)
    expect(configValid(config)).toBe(true)
    expect(configValid({ ...config, margin_rate: 2 })).toBe(false)
    expect(configValid({ ...config, kinds: { ...config.kinds, capteur: { ...config.kinds.capteur, composants: [] } } })).toBe(false)
  })

  it('modifier un montant recalcule le prix ; l’enregistrement montre ancien et nouveau prix', async () => {
    const view: BackendPricingView = { config, defaults: config, materiels: [], modifie: false, modifie_le: null, modifie_par: null }
    vi.mocked(rawAdminPricing).mockResolvedValue(view)
    vi.mocked(rawAdminSavePricing).mockResolvedValue(view)
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdminPricingPage />
      </QueryClientProvider>,
    )
    const capteur = await screen.findByRole('region', { name: 'Capteur' })
    expect(screen.getByRole('button', { name: 'Enregistrer les prix' })).toBeDisabled()
    fireEvent.change(within(capteur).getByLabelText('Composants : montant 2 (FCFA)'), { target: { value: '20000' } })
    expect(within(capteur).getByText(/enregistré : 55\s?000/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les prix' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/55\s?000\s?FCFA → /)).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(rawAdminSavePricing).toHaveBeenCalled())
    expect(vi.mocked(rawAdminSavePricing).mock.calls[0][0].kinds.capteur.composants[1].fcfa).toBe(20000)
  })
})
