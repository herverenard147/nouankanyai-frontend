import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

/** Abonnement payé d'avance pour 30 jours (décision du propriétaire, 2026-10-21). */
import { SubscriptionStatus } from '@/components/billing/SubscriptionStatus'
import type { BackendSubscription } from '@/types/backend'

const base: BackendSubscription = {
  montant_fcfa: 50000, exige: true, actif: false, jusqu_au: null, termine_le: null, jours_restants: 0, duree_jours: 30, paiements: [],
}

describe('abonnement payé d’avance', () => {
  it('actif : date de fin et renouvellement sans perte', () => {
    render(<SubscriptionStatus abonnement={{ ...base, actif: true, jusqu_au: '2026-11-20T10:00:00', jours_restants: 12 }} />)
    expect(screen.getByRole('status').textContent).toMatch(/payé jusqu’au 20\/11\/2026 \(12 jours\)/)
  })

  it('terminé, PME : services suspendus, historique gardé, jours sans abonnement non facturés', () => {
    render(<SubscriptionStatus abonnement={{ ...base, termine_le: '2026-10-05T10:00:00' }} />)
    const t = screen.getByRole('status').textContent ?? ''
    expect(t).toMatch(/terminé le 05\/10\/2026/)
    expect(t).toMatch(/suspendus jusqu’au paiement/)
    expect(t).toMatch(/historique, vos factures et vos relevés restent accessibles/)
    expect(t).toMatch(/jours sans abonnement ne sont pas facturés/)
  })

  it('terminé, ménage : formule Découverte jusqu’au paiement ; facturation réelle fermée : rien d’exigé', () => {
    const { unmount } = render(<SubscriptionStatus menage abonnement={{ ...base, montant_fcfa: 2900 }} />)
    expect(screen.getByRole('status').textContent).toMatch(/repasse en Découverte/)
    unmount()
    render(<SubscriptionStatus abonnement={{ ...base, exige: false }} />)
    expect(screen.getByRole('status').textContent).not.toMatch(/suspendus/)
  })

  it('compte sans abonnement payant : rien n’est affiché', () => {
    const { container } = render(<SubscriptionStatus abonnement={{ ...base, montant_fcfa: null }} />)
    expect(container.textContent).toBe('')
  })
})
