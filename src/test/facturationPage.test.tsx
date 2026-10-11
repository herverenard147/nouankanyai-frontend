import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendBilling } from '@/types/backend'

const billing = vi.hoisted(() => ({ current: null as unknown }))
const requestTier = vi.fn()
const cancelTier = vi.fn()
vi.mock('@/hooks/queries/useBilling', () => ({
  useBilling: () => ({ status: 'success', data: billing.current }),
  useRequestTier: () => ({ mutate: requestTier, isPending: false, error: null }),
  useCancelTierRequest: () => ({ mutate: cancelTier, isPending: false, error: null }),
}))

import { FacturationPage } from '@/pages/app/FacturationPage'

const tiers = [
  { id: 'decouverte', nom: 'Découverte', prix_mensuel_fcfa: 0, max_machines: 3, assistant_ia: false, alertes_avancees: false, fonctionnalites: [] },
  { id: 'essentiel', nom: 'Essentiel', prix_mensuel_fcfa: 2900, max_machines: 10, assistant_ia: false, alertes_avancees: true, fonctionnalites: [] },
  { id: 'optimum', nom: 'Optimum', prix_mensuel_fcfa: 7900, max_machines: null, assistant_ia: true, alertes_avancees: true, fonctionnalites: [] },
]
const base: BackendBilling = {
  segment: 'menage',
  contract: null,
  effective_tier: 'decouverte',
  tiers: tiers as BackendBilling['tiers'],
  defaults: { audit_fee_fcfa: 750000, saas_fee_fcfa: 50000, savings_share_pct: 40 },
  statements: [],
  estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] },
  legacy_invoices: [],
}

function show(data: BackendBilling) {
  billing.current = data
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <FacturationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('page Facturation', () => {
  it('le Ménage voit les trois paliers et peut demander un changement', () => {
    show(base)
    expect(screen.getByText('Votre formule')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Demander Essentiel' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Demander Optimum' })).toBeTruthy()
    expect(screen.getByText(/l’équipe Nouankany le valide/)).toBeTruthy()
  })

  // Vu sur le staging (2026-10-11) : compte de démonstration affiché « Optimum », contrat en « Découverte ».
  it('compte de démonstration : aucun bouton sans effet sur la formule déjà en contrat', () => {
    show({ ...base, effective_tier: 'optimum', access: { tier: 'decouverte', reason: 'demonstration', max_machines: null, assistant_ia: true, alertes_avancees: true } })
    expect(screen.getByText(/Compte de démonstration/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Découverte/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Demander Optimum' })).toBeTruthy()
  })

  it('une demande en cours se voit et s’annule par un bouton dédié', () => {
    show({
      ...base,
      contract: { id: 'c', kind: 'menage', tier: 'decouverte', requested_tier: 'essentiel', audit_fee_fcfa: null, saas_fee_fcfa: null, savings_share_pct: null, baseline_kwh: null, baseline_period: null, start_month: null, end_month: null, status: 'actif' },
    })
    expect(screen.getByText('Demande envoyée')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Demander Essentiel' })).toBeNull()
    screen.getByRole('button', { name: 'Annuler la demande' }).click()
    expect(cancelTier).toHaveBeenCalled()
  })

  it('pendant l’essai, la page dit quelle formule restera ensuite', () => {
    show({ ...base, effective_tier: 'optimum', access: { tier: 'decouverte', reason: 'essai', max_machines: null, assistant_ia: true, alertes_avancees: true, trial_ends_at: '2026-10-25T00:00:00' } })
    expect(screen.getByText(/Essai gratuit jusqu’au 25\/10\/2026/)).toBeTruthy()
    expect(screen.getByText('Votre formule après l’essai')).toBeTruthy()
  })

  it('une PME sans contrat est invitée à demander un audit', () => {
    show({ ...base, segment: 'pme_industrie', effective_tier: null })
    expect(screen.getByRole('link', { name: 'Demander un audit' })).toBeTruthy()
  })

  it('une PME sous contrat voit le détail du calcul de chaque relevé', () => {
    show({
      ...base,
      segment: 'pme_industrie',
      contract: { id: 'c', kind: 'pme_industrie', tier: null, requested_tier: null, audit_fee_fcfa: 750000, saas_fee_fcfa: 50000, savings_share_pct: 40, baseline_kwh: 10000, baseline_period: null, start_month: '2026-09', end_month: null, status: 'actif' },
      statements: [
        { id: 's', month: '2026-09', status: 'a_payer', baseline_kwh: 10000, actual_kwh: 9000, savings_kwh: 1000, savings_fcfa: 101840, saas_fee_fcfa: 50000, savings_share_fcfa: 40736, audit_fee_fcfa: 0, total_fcfa: 90736, detail: { etapes: ['Économies : 10000 kWh − 9000 kWh = 1000 kWh'] }, paid_at: null },
      ],
    })
    expect(screen.getByText('Votre contrat')).toBeTruthy()
    expect(screen.getByText(/Économies : 10000 kWh/)).toBeTruthy()
    expect(screen.getByText('À payer')).toBeTruthy()
  })
})
