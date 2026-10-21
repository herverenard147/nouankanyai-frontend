import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Droits par formule ménage (décision du propriétaire, 2026-10-21) : un écran non inclus le dit et mène aux formules. */
const access = vi.hoisted(() => ({ current: {} as Record<string, unknown> }))
vi.mock('@/hooks/queries/useBilling', () => ({ useAccess: () => access.current, useBilling: () => ({ data: undefined }) }))
vi.mock('@/hooks/queries/usePrediction', () => ({ usePredictionsBundle: () => ({ status: 'pending', data: undefined }) }))

import { PredictionSummary } from '@/components/overview/PredictionSummary'
import { AdvicePage } from '@/pages/app/AdvicePage'
import { PredictionPage } from '@/pages/app/PredictionPage'
import { useSessionStore } from '@/store/sessionStore'

function show(ui: React.ReactNode) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('droits des formules', () => {
  beforeEach(() => {
    useSessionStore.setState({
      session: { userId: 'u', token: 't', refreshToken: 'r', profile: 'menage', platformRole: null, displayName: 'M', subtitle: 'Particulier', isTeamOwner: true, isTrial: false, isDemo: false },
    })
  })

  it('Découverte : prédictions verrouillées, avec un lien vers les formules', () => {
    access.current = { loaded: true, predictions: false, anomalies: false, maxPredictions: 0, predicted: [] }
    show(<PredictionPage />)
    expect(screen.getByText(/incluses dans Essentiel \(2 appareils\) et Optimum \(4 appareils\)/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Voir les formules →' }).getAttribute('href')).toBe('/app/facturation')
  })

  it('Découverte : l’aperçu montre l’encadré au lieu d’un chargement sans fin', () => {
    access.current = { loaded: true, predictions: false, anomalies: false, maxPredictions: 0, predicted: [] }
    show(<PredictionSummary profile="menage" />)
    expect(screen.getByRole('region', { name: 'Prédictions' })).toBeTruthy()
  })

  it('Essentiel : la page dit combien d’appareils sont prévus', () => {
    access.current = { loaded: true, predictions: true, anomalies: false, maxPredictions: 2, predicted: ['A', 'B'] }
    show(<PredictionPage />)
    expect(screen.getByText(/Votre formule prévoit 2 appareils : ceux qui consomment le plus/)).toBeTruthy()
  })

  it('Conseils : réservés à Optimum', () => {
    access.current = { loaded: true, predictions: true, anomalies: false, maxPredictions: 2, predicted: [] }
    show(<AdvicePage />)
    expect(screen.getByText(/inclus dans la formule Optimum/)).toBeTruthy()
  })
})
