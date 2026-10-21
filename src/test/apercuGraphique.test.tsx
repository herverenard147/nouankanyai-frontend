import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

/** Vue d'ensemble (2026-10-20) : la prévision utilise le même graphique que les pages Conso et Prédiction. */
const start = Date.parse('2026-10-20T22:00:00Z')
vi.mock('@/hooks/queries/usePrediction', () => ({
  usePredictionsBundle: () => ({
    status: 'success',
    data: {
      perDevice: [],
      global: {
        title: 'Prédiction globale : tous les équipements', value: '12,0', unit: 'kW', intervalLabel: 'coût estimé sur 24 h : 9 000 FCFA',
        modelNote: '', modelName: '', provenance: 'estime', yAxisUnit: 'kW', costFcfa: 9000,
        series: Array.from({ length: 24 }, (_, i) => ({ label: `${(22 + i) % 24} h`, value: 10 + (i % 5), displayValue: '', percent: 50 })),
        starts: Array.from({ length: 24 }, (_, i) => start + i * 3600_000),
      },
    },
  }),
}))
vi.mock('@/hooks/queries/useBilling', () => ({ useAccess: () => ({ loaded: false, predictions: true, maxPredictions: null, predicted: null }) }))
import { PredictionSummary } from '@/components/overview/PredictionSummary'

describe('vue d’ensemble : prévision', () => {
  it('axes nommés et changement de jour marqué', () => {
    render(<MemoryRouter><PredictionSummary profile="industrie" /></MemoryRouter>)
    expect(screen.getByText('axe des ordonnées : Puissance prévue (kW)')).toBeTruthy()
    expect(screen.getByText(/axe des abscisses : Heure, 24 prochaines heures/)).toBeTruthy()
    expect(screen.getAllByText(/21 oct/).length).toBeGreaterThan(0)   // minuit : la date du lendemain sous l'axe
  })
})
