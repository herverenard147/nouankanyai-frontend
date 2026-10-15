import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActionAlert } from '@/types/domain'

/**
 * Niveaux de signalement (décision du propriétaire, 2026-10-15) : une alerte dit qu'un seuil est franchi maintenant ;
 * un écart à l'habitude sous le seuil est « à vérifier », listé à part et jamais compté parmi les alertes.
 */
vi.mock('@/hooks/queries/useMachineCrud', () => ({
  useAutoResolveMachine: vi.fn(() => ({ status: 'idle', attempt: 0, maxAttempts: 5, lastResult: null, error: null, trigger: vi.fn(), autoEnabled: false })),
}))

vi.mock('@/api/rawBackend', () => ({
  getCachedMachines: vi.fn(async () => [{ machine_id: 'TV-01', nom: 'Téléviseur', status: 'actif' }, { machine_id: 'CLIM-01', nom: 'Climatiseur', status: 'alerte' }]),
  getCachedRecommend: vi.fn(async () => ({
    recommendations: [
      { machine_id: 'CLIM-01', type: 'alerte', severity: 'critique', title: 'Anomalie détectée sur Climatiseur', description: 'Seuil dépassé.', action: 'Nettoyez le filtre.', gain_fcfa: 0 },
      { machine_id: 'TV-01', type: 'a_verifier', severity: 'faible', title: 'Comportement inhabituel sur Téléviseur', description: 'Écart sans dépasser votre seuil.', action: 'Gardez un œil.', gain_fcfa: 0 },
    ],
  })),
  rawPlatformAlerts: vi.fn(),
  rawMachineHistory: vi.fn(),
}))

import { AlertCard } from '@/components/alerts/AlertCard'
import { fetchActionAlerts, fetchToCheckAlerts } from '@/api/alerts'
import { fetchAdvice } from '@/api/advice'

describe('niveaux de signalement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('les alertes ne contiennent que les seuils franchis', async () => {
    const alerts = await fetchActionAlerts('menage')
    expect(alerts.map((a) => a.title)).toEqual(['Anomalie détectée sur Climatiseur'])
    expect(alerts.every((a) => a.tier === 'alerte')).toBe(true)
  })

  it('« à vérifier » est une liste à part', async () => {
    const toCheck = await fetchToCheckAlerts('menage')
    expect(toCheck).toHaveLength(1)
    expect(toCheck[0]).toMatchObject({ tier: 'a_verifier', level: 'à vérifier', title: 'Comportement inhabituel sur Téléviseur' })
  })

  it('les conseils couvrent les deux', async () => {
    const advice = await fetchAdvice('menage')
    expect(advice.map((a) => a.title)).toEqual(['Anomalie détectée sur Climatiseur', 'Comportement inhabituel sur Téléviseur'])
  })

  it('une carte « à vérifier » ne dit ni « une personne doit intervenir » ni « résoudre »', () => {
    const alert: ActionAlert = {
      kind: 'action', id: 't1', tier: 'a_verifier', machineId: 'TV-01', level: 'à vérifier', severity: 'faible',
      title: 'Comportement inhabituel sur Téléviseur', detail: 'Écart sans dépasser votre seuil.', basis: 'Gardez un œil.',
      provenance: 'synthetique', ctaLabel: 'Voir les conseils', ctaTarget: '/app/conseils',
    }
    render(<MemoryRouter><AlertCard variant="action" alert={alert} /></MemoryRouter>)
    expect(screen.getByText('à vérifier · aucun seuil dépassé')).toBeInTheDocument()
    expect(screen.queryByText(/une personne doit intervenir/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vérifier maintenant' })).toBeInTheDocument()
  })
})
