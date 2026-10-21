import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { isRouteAllowed } from '@/lib/navConfig'

/**
 * Grille de vérification (demande du propriétaire, 2026-10-21) : quelles pages chaque type de compte peut ouvrir, et
 * ce que chaque formule du ménage ouvre ou verrouille. Toute évolution volontaire doit être reportée ici.
 */
const PAGES = ['apercu', 'premiers-pas', 'alertes', 'consommation', 'prediction', 'factures', 'conseils', 'recommandations', 'equipements',
  'machines', 'machines/X', 'equipements/X', 'rapports', 'facturation', 'journal', 'audit', 'plan-action', 'boitier', 'boitier/X',
  'parametres', 'sources', 'sources/X', 'aide', 'interventions', 'assistant', 'admin/boitiers', 'admin/sante', 'admin/modeles',
  'admin/donnees', 'admin/utilisateurs', 'admin/leads', 'admin/messages', 'admin/facturation']

const EXPECTED: Record<'menage' | 'pme' | 'industrie' | 'admin' | 'technicien', string> = {
  menage: 'apercu premiers-pas alertes consommation prediction factures conseils recommandations equipements equipements/X rapports facturation boitier boitier/X parametres aide assistant',
  pme: 'apercu premiers-pas alertes consommation prediction factures conseils recommandations equipements equipements/X rapports facturation audit plan-action boitier boitier/X parametres sources sources/X aide assistant',
  industrie: 'apercu premiers-pas alertes consommation prediction factures conseils recommandations machines machines/X rapports facturation journal audit plan-action parametres sources sources/X aide assistant',
  admin: 'apercu premiers-pas alertes consommation prediction journal audit parametres aide assistant admin/boitiers admin/sante admin/modeles admin/donnees admin/utilisateurs admin/leads admin/messages admin/facturation',
  technicien: 'parametres aide interventions assistant',
}

describe('pages autorisées par type de compte', () => {
  for (const [profile, expected] of Object.entries(EXPECTED)) {
    it(profile, () => {
      expect(PAGES.filter((p) => isRouteAllowed(`/app/${p}`, profile as keyof typeof EXPECTED)).join(' ')).toBe(expected)
    })
  }
})

const access = vi.hoisted(() => ({ current: {} as Record<string, unknown>, billing: undefined as unknown }))
vi.mock('@/hooks/queries/useBilling', () => ({ useAccess: () => access.current, useBilling: () => ({ data: access.billing }) }))
vi.mock('@/hooks/queries/usePrediction', () => ({ usePredictionsBundle: () => ({ status: 'pending', data: undefined }) }))
vi.mock('@/api/rawBackend', async (orig) => ({ ...(await orig<object>()), rawPrepaid: vi.fn(() => Promise.resolve([])) }))

import { AdvicePage } from '@/pages/app/AdvicePage'
import { AssistantPage } from '@/pages/app/AssistantPage'
import { PredictionPage } from '@/pages/app/PredictionPage'
import { RecommendationsPage } from '@/pages/app/RecommendationsPage'
import { useSessionStore } from '@/store/sessionStore'

const TIERS = {
  decouverte: { loaded: true, predictions: false, anomalies: false, assistant: false, customThresholds: false, maxPredictions: 0, predicted: [] },
  essentiel: { loaded: true, predictions: true, anomalies: false, assistant: false, customThresholds: true, maxPredictions: 2, predicted: ['A', 'B'] },
  optimum: { loaded: true, predictions: true, anomalies: true, assistant: true, customThresholds: true, maxPredictions: 4, predicted: ['A', 'B', 'C', 'D'] },
}

function show(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ce que chaque formule du ménage ouvre', () => {
  const locked = () => screen.queryByRole('link', { name: 'Voir les formules →' }) !== null
  for (const [tier, rights] of Object.entries(TIERS)) {
    it(tier, () => {
      useSessionStore.setState({
        session: { userId: 'u', token: 't', refreshToken: 'r', profile: 'menage', platformRole: null, displayName: 'M', subtitle: 'Particulier', isTeamOwner: true, isTrial: false, isDemo: false },
      })
      access.current = rights
      access.billing = { access: { assistant_ia: rights.assistant } }
      const pred = show(<PredictionPage />)
      expect(locked(), `${tier} prédiction`).toBe(!rights.predictions)
      pred.unmount()
      const advice = show(<AdvicePage />)
      expect(locked(), `${tier} conseils`).toBe(!rights.anomalies)
      advice.unmount()
      const recos = show(<RecommendationsPage />)
      expect(locked(), `${tier} recommandations`).toBe(!rights.anomalies)
      recos.unmount()
      const assistant = show(<AssistantPage />)
      expect(assistant.container.textContent === '', `${tier} assistant`).toBe(!rights.assistant)
      assistant.unmount()
    })
  }
})
