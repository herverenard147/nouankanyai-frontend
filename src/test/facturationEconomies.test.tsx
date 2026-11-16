import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendBilling } from '@/types/backend'

/** D13 et D3 (décisions CNID du 2026-11-10) : section « Économies » de la page Facturation d'une entreprise. */
const billing = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/hooks/queries/useBilling', () => ({
  useBilling: () => ({ status: 'success', data: billing.current }),
  useChangeTier: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null, reset: () => {} }),
}))

import { FacturationPage } from '@/pages/app/FacturationPage'

const facteur = { kg_par_kwh: 0.5, source: 'Source envoyée par le serveur', annee: 2019, methode: 'estimation par facteur réseau, jamais une mesure' }
const base: BackendBilling = {
  segment: 'pme_industrie',
  contract: null,
  effective_tier: null,
  tiers: [],
  defaults: { audit_fee_fcfa: 750000, saas_fee_fcfa: 50000, savings_share_pct: 40 },
  statements: [],
  estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] },
  legacy_invoices: [],
} as unknown as BackendBilling

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

describe('économies attendues des actions faites', () => {
  it('en FCFA, kWh et kg CO2, avec le facteur et la source envoyés par le serveur', () => {
    const { container } = show({
      ...base,
      economies_estimees: { mois: '2026-11', actions_faites: 2, fcfa: 10184, kwh: 100, kg_co2: 50, provenance: 'estime', facteur_co2: facteur },
    })
    const text = container.textContent ?? ''
    expect(text).toMatch(/2 actions faites/)
    expect(text).toMatch(/100 kWh et 50 kg CO2 évités/)
    expect(text).toMatch(/500 g CO2 par kWh/)
    expect(text).toContain('Source envoyée par le serveur')
    expect(text).not.toMatch(/actions automatiques/)
  })

  it('sans action faite : renvoie au plan d’action', () => {
    show({ ...base, economies_estimees: { mois: '2026-11', actions_faites: 0, fcfa: 0, kwh: 0, kg_co2: 0, provenance: 'estime', facteur_co2: facteur } })
    expect(screen.getByRole('link', { name: 'plan d’action' })).toHaveAttribute('href', '/app/plan-action')
  })
})
