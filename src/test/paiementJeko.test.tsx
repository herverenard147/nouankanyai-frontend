import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendBilling } from '@/types/backend'

/** Paiement d'un relevé par Jèko : boutons de choix du moyen, retour de la page de paiement. */
const billing = vi.hoisted(() => ({ current: null as unknown }))
const pay = vi.hoisted(() => ({ mutate: vi.fn() }))
const state = vi.hoisted(() => ({ current: { data: undefined as unknown } }))
vi.mock('@/hooks/queries/useBilling', () => ({
  useBilling: () => ({ status: 'success', data: billing.current }),
  useChangeTier: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null, reset: () => {} }),
}))
vi.mock('@/hooks/queries/usePaiement', () => ({
  usePayStatement: () => ({ mutate: pay.mutate, isPending: false, error: null }),
  usePaymentState: () => state.current,
}))

import { FacturationPage } from '@/pages/app/FacturationPage'

const statement = { id: 'r1', month: '2026-10', kind: 'mensuel', status: 'a_payer', total_fcfa: 50000, due_at: '2026-12-01T00:00:00', detail: {} }
const base = {
  segment: 'pme_industrie', effective_tier: null,
  contract: { kind: 'pme_industrie', baseline_kwh: 1000, saas_fee_fcfa: 50000, savings_share_pct: 40, audit_fee_fcfa: 750000, baseline_period: null, start_month: '2026-04' }, tiers: [], defaults: { audit_fee_fcfa: 1, saas_fee_fcfa: 1, savings_share_pct: 40 },
  statements: [statement], estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] }, legacy_invoices: [],
} as unknown as BackendBilling

function show(data: BackendBilling, url = '/app/facturation') {
  billing.current = data
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[url]}>
        <FacturationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('paiement Jèko', () => {
  it('propose les cinq moyens sur un relevé à payer quand le paiement en ligne est ouvert, sans envoyer le montant', () => {
    show({ ...base, paiement_en_ligne: true })
    for (const label of ['Wave', 'Orange Money', 'MTN Mobile Money', 'Moov Money', 'Djamo']) expect(screen.getByRole('button', { name: label })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Orange Money' }))
    expect(pay.mutate).toHaveBeenCalledWith({ statementId: 'r1', method: 'orange' })
  })

  it('n’affiche aucun bouton quand le paiement en ligne n’est pas ouvert', () => {
    show({ ...base, paiement_en_ligne: false })
    expect(screen.queryByRole('button', { name: 'Wave' })).toBeNull()
  })

  it('n’affiche aucun bouton sur un relevé déjà payé', () => {
    show({ ...base, paiement_en_ligne: true, statements: [{ ...statement, status: 'paye' }] } as unknown as BackendBilling)
    expect(screen.queryByRole('button', { name: 'Wave' })).toBeNull()
  })

  it('au retour de la page de paiement, annonce une confirmation en cours, puis le paiement confirmé', () => {
    state.current = { data: { status: 'pending' } }
    const { unmount } = show({ ...base, paiement_en_ligne: true }, '/app/facturation?paiement=retour&ref=nk-1')
    expect(screen.getByRole('status').textContent).toMatch(/en cours de confirmation/)
    unmount()
    state.current = { data: { status: 'paid' } }
    show({ ...base, paiement_en_ligne: true }, '/app/facturation?paiement=retour&ref=nk-1')
    expect(screen.getByRole('status').textContent).toMatch(/Paiement confirmé/)
  })

  it('annonce l’échec sans dire qu’un montant a été prélevé', () => {
    state.current = { data: { status: 'failed' } }
    show({ ...base, paiement_en_ligne: true }, '/app/facturation?paiement=echec&ref=nk-1')
    expect(screen.getByRole('alert').textContent).toMatch(/n’a pas abouti/)
  })
})
