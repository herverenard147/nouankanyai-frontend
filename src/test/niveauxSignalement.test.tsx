import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ActionAlert } from '@/types/domain'

/**
 * Niveaux de signalement (décision du propriétaire, 2026-10-15) : une alerte dit qu'un seuil est franchi maintenant ;
 * un écart à l'habitude sous le seuil est « à vérifier », listé à part et jamais compté parmi les alertes.
 */
vi.mock('@/hooks/queries/useAlertRegistry', () => ({
  useAlertFeedback: () => ({ mutate: vi.fn(), reset: vi.fn(), isPending: false, error: null }),
  useAlertTakeCharge: () => ({ mutate: vi.fn(), isPending: false }),
}))
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
  // Une seule source (2026-10-20) : les listes sont les alertes ouvertes du registre. Celle du compresseur n'est plus
  // vue par le diagnostic du moment (dernier relevé ancien) : elle reste listée, comme dans l'historique.
  rawAlertRegistry: vi.fn(async () => [
    entry({ id: 'a1', machine_code: 'CLIM-01', machine_nom: 'Climatiseur', kind: 'surchauffe', kind_label: 'Surchauffe', level: 'alerte', description: 'Seuil dépassé.', action: 'Nettoyez le filtre.' }),
    entry({ id: 'a2', machine_code: 'TV-01', machine_nom: 'Téléviseur', kind: 'ecart_habitude', kind_label: 'Comportement inhabituel', level: 'a_verifier', description: 'Écart sans dépasser votre seuil.' }),
    entry({ id: 'a3', machine_code: 'COMP-01', machine_nom: 'Compresseur à vis', kind: 'ecart_habitude', kind_label: 'Comportement inhabituel', level: 'a_verifier', mute: true, last_reading_at: '2026-10-18T21:00:00' }),
  ]),
  rawPlatformAlerts: vi.fn(),
  rawMachineHistory: vi.fn(),
}))

function entry(over: Record<string, unknown>) {
  return {
    machine_code: null, machine_nom: null, kind: null, kind_label: null, level: null, source: 'moteur', title: null, description: null, action: null,
    reco: { id: null, version: null, cause: null, steps: [] }, opened_provenance: 'simulation', created_at: '2026-10-19T09:07:55', last_seen_at: '2026-10-19T09:07:55',
    is_open: true, closed_at: null, closure_trigger: null, closure_provenance: null, resolution: null, needs_feedback: false, feedback: null,
    reopen_count: 0, reopened_at: null, taken_at: null, taken_by_nom: null, last_reading_at: '2026-10-20T09:00:00', mute: false, ...over,
  }
}

import { AlertCard } from '@/components/alerts/AlertCard'
import { fetchActionAlerts, fetchToCheckAlerts } from '@/api/alerts'
import { fetchAdvice } from '@/api/advice'

describe('niveaux de signalement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('les alertes ne contiennent que les seuils franchis', async () => {
    const alerts = await fetchActionAlerts('menage')
    expect(alerts.map((a) => a.title)).toEqual(['Surchauffe : Climatiseur'])
    expect(alerts.every((a) => a.tier === 'alerte')).toBe(true)
    expect(alerts[0]).toMatchObject({ id: 'a1', severity: 'critique' })
  })

  it('« à vérifier » est une liste à part', async () => {
    const toCheck = await fetchToCheckAlerts('menage')
    expect(toCheck.map((a) => a.title)).toEqual(['Comportement inhabituel : Téléviseur', 'Comportement inhabituel : Compresseur à vis'])
    expect(toCheck[0]).toMatchObject({ tier: 'a_verifier', level: 'à vérifier' })
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

describe('une alerte en cours est toujours visible et se documente (2026-10-20)', () => {
  it('appareil muet : la carte le dit, avec « Je m’en occupe » et « Fausse alerte »', async () => {
    const [, mute] = await fetchToCheckAlerts('industrie')
    render(<MemoryRouter><AlertCard variant="action" alert={mute} /></MemoryRouter>)
    expect(screen.getByText(/Aucun nouveau relevé depuis le 18\/10\/2026 21:00:00/)).toBeInTheDocument()
    expect(screen.getByText(/Depuis le 19\/10\/2026 09:07:55/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Je m’en occupe' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fausse alerte' })).toBeInTheDocument()
  })
})
