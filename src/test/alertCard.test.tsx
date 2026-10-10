import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AlertCard } from '@/components/alerts/AlertCard'
import type { ActionAlert } from '@/types/domain'

/**
 * Boîte noire, dérivée du contrat seul : quand la relance automatique atteint
 * son plafond sans résolution, le message affiché ne doit JAMAIS prétendre que
 * l'alerte est résolue — exigence explicite de l'utilisateur sur l'honnêteté
 * de ce flux.
 */
vi.mock('@/hooks/queries/useMachineCrud', () => ({
  useAutoResolveMachine: vi.fn(),
}))

import { useAutoResolveMachine } from '@/hooks/queries/useMachineCrud'

const alert: ActionAlert = {
  kind: 'action',
  id: 'a1',
  machineId: 'M1',
  level: 'sévérité modérée',
  severity: 'modérée',
  title: 'Anomalie détectée sur Four',
  detail: 'Température anormale.',
  basis: 'Lancez un diagnostic.',
  provenance: 'synthetique',
  ctaLabel: 'Voir les conseils',
  ctaTarget: '/app/conseils',
}

function renderCard() {
  return render(
    <MemoryRouter>
      <AlertCard variant="action" alert={alert} />
    </MemoryRouter>,
  )
}

describe('AlertCard — honnêteté du message needs_human', () => {
  it('ne prétend jamais que c’est résolu quand le plafond est atteint', () => {
    vi.mocked(useAutoResolveMachine).mockReturnValue({
      status: 'needs_human',
      attempt: 5,
      maxAttempts: 5,
      lastResult: { provenance: 'simulation', resolved: false, temperature_c: 70, vibration_hz: 50, pressure_bar: 2, power_kw: 3, diagnostic: null },
      error: null,
      trigger: vi.fn(),
      autoEnabled: true,
    })

    renderCard()

    expect(screen.getByText(/Non résolu après 5 tentatives automatiques/)).toBeInTheDocument()
    expect(screen.getByText(/intervention humaine est nécessaire/i)).toBeInTheDocument()
    // Volet 2 (C4) : aucun capteur réel, la mesure est dite simulée.
    expect(screen.getByText(/dernière mesure simulée/i)).toBeInTheDocument()
    // Jamais de formulation affirmant une résolution (seul "Non résolu" est acceptable).
    expect(screen.queryByText(/\best résolue\b/i)).not.toBeInTheDocument()
  })

  it('affiche la tentative en cours pendant la relance automatique', () => {
    vi.mocked(useAutoResolveMachine).mockReturnValue({
      status: 'retrying',
      attempt: 2,
      maxAttempts: 5,
      lastResult: null,
      error: null,
      trigger: vi.fn(),
      autoEnabled: true,
    })

    renderCard()
    expect(screen.getByRole('button', { name: 'Tentative 2/5 en cours…' })).toBeDisabled()
  })
})
