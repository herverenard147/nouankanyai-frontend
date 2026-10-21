import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

/** Part des économies par facture CIE, report de l'impayé (décision du propriétaire, 2026-10-21). */
import { StatementList } from '@/components/billing/StatementList'
import type { BackendBillingStatement } from '@/types/backend'

const base: BackendBillingStatement = {
  id: 'p1', month: '2026-12', status: 'a_payer', baseline_kwh: 20000, actual_kwh: 18000, savings_kwh: 2000, savings_fcfa: 173240,
  saas_fee_fcfa: 0, savings_share_fcfa: 69296, audit_fee_fcfa: 0, total_fcfa: 69296, detail: { periode: 'novembre et décembre 2026' },
  paid_at: null, due_at: '2027-01-20T10:00:00', kind: 'part', periode_debut: '2026-11', periode_fin: '2026-12', report_fcfa: null,
}

describe('parts des économies', () => {
  it('une facture de deux mois : une part, sa période, son échéance et la règle du report', () => {
    render(<StatementList statements={[base]} />)
    expect(screen.getByText('Part des économies : novembre et décembre 2026')).toBeTruthy()
    expect(screen.getByText(/À régler avant le 20\/01\/2027/).textContent).toMatch(/s’ajoute à la part suivante ; deux parts impayées de suite suspendent/)
  })

  it('part reportée et frais d’audit', () => {
    render(
      <StatementList
        statements={[
          { ...base, id: 'p0', status: 'reporte', reporte_sur: 'p1' },
          { ...base, id: 'a', kind: 'audit', month: '2026-07', total_fcfa: 750000, detail: {} },
        ]}
      />,
    )
    expect(screen.getByText('Reportée sur la part suivante')).toBeTruthy()
    expect(screen.getByText('Frais d’audit')).toBeTruthy()
  })

  it('une part qui contient déjà un report ne promet plus de report', () => {
    render(<StatementList statements={[{ ...base, report_fcfa: 50000, total_fcfa: 119296 }]} />)
    expect(screen.getByText(/À régler avant le/).textContent).not.toMatch(/s’ajoute/)
  })
})
