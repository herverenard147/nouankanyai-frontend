import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import type { BackendBilling } from '@/types/backend'

/** S-09 (décision du propriétaire, 2026-11-14) : le site de base ne porte aucune affirmation non prouvée. */
const billing = vi.hoisted(() => ({ current: null as unknown }))
vi.mock('@/hooks/queries/useBilling', () => ({
  useBilling: () => ({ status: 'success', data: billing.current }),
  useChangeTier: () => ({ mutate: () => {}, isPending: false, isSuccess: false, error: null, reset: () => {} }),
}))
vi.mock('@/hooks/queries/useBoitiers', () => ({
  useBoitiers: () => ({ status: 'success', isSuccess: true, data: [] }),
  useBoitierRequests: () => ({ status: 'success', isSuccess: true, data: [] }),
  useBoitierMutations: () => ({ cancelRequest: { mutate: () => {}, error: null } }),
  useBoitierPrice: () => ({ data: { unit_price_fcfa: 170500 } }),
}))
vi.mock('@/store/sessionStore', () => ({
  useSessionStore: (select: (s: unknown) => unknown) => select({ session: { profile: 'menage', isTrial: false } }),
}))

import { BoitiersPage } from '@/pages/app/BoitiersPage'
import { FacturationPage } from '@/pages/app/FacturationPage'
import { HowItWorksPage } from '@/pages/landing/HowItWorksPage'
import { AboutSection } from '@/pages/landing/sections/AboutSection'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { NAV_BY_PROFILE } from '@/lib/navConfig'

const INTERDITS = [/IA prédictive/i, /prédit votre/i, /prédire votre/i, /finance les capteurs/i, /Pas d.estimation/i, /entreprise ivoirienne/i, /Une entreprise ivoirienne/i]

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'test' ? [] : sources(path)
    return /\.(tsx?|html)$/.test(name) ? [path] : []
  })
}

function wrap(node: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('affirmations retirées du site de base (S-09)', () => {
  it('aucune source du front ni la méta-description ne porte une formulation interdite', () => {
    const fichiers = [...sources('src'), 'index.html']
    const trouves = fichiers.flatMap((f) => INTERDITS.filter((re) => re.test(readFileSync(f, 'utf8'))).map((re) => `${f} : ${re}`))
    expect(trouves).toEqual([])
  })

  it('la méta-description décrit ce que le produit fait', () => {
    const html = readFileSync('index.html', 'utf8')
    expect(html).toMatch(/analyse statistique de la consommation/)
    expect(html).toMatch(/lecture automatique de la facture par IA/)
  })

  it('À propos : équipe de projet, plus de société ni d’IA prédictive', () => {
    wrap(<AboutSection />)
    expect(screen.getByText(/équipe de projet basée en Côte d’Ivoire/)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/prédictive|entreprise ivoirienne/i)
  })

  it('Comment ça marche : pas de prédiction', () => {
    wrap(<HowItWorksPage />)
    expect(document.body.textContent).not.toMatch(/prédit|prédictive/i)
    expect(document.body.textContent).toMatch(/analyse statistique de la consommation/)
  })

  it('FAQ : le matériel est vendu, les économies viennent des factures CIE déclarées', () => {
    wrap(<FaqSection />)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/finance les capteurs|Pas d.estimation/)
    expect(text).toMatch(/factures CIE/)
  })

  it('Mon boîtier : prototype, aucun prix, commande remplacée par « Disponible après le pilote »', () => {
    wrap(<BoitiersPage />)
    expect(screen.getByText('Prototype, non commercialisé')).toBeTruthy()
    expect(screen.queryByText(/Commander du matériel/)).toBeNull()
    expect(screen.queryByText(/170\s?500/)).toBeNull()
    const bouton = screen.getByRole('button', { name: 'Disponible après le pilote' })
    expect(bouton).toBeDisabled()
  })

  it('menu : « Mon boîtier » est étiqueté prototype', () => {
    const labels = Object.values(NAV_BY_PROFILE).flat().filter((e) => e.path === '/app/boitier').map((e) => e.label)
    expect(labels.length).toBeGreaterThan(0)
    labels.forEach((l) => expect(l).toMatch(/prototype/i))
  })

  it('Facturation : relevés indicatifs', () => {
    const base = {
      segment: 'pme_industrie',
      contract: { kind: 'pme_industrie', baseline_kwh: 1000, saas_fee_fcfa: 50000, savings_share_pct: 40, audit_fee_fcfa: 750000, start_month: '2026-12' },
      effective_tier: 'decouverte', tiers: [], defaults: { audit_fee_fcfa: 750000, saas_fee_fcfa: 50000, savings_share_pct: 40 },
      statements: [], estimated_ai_savings: { month_total_fcfa: 0, weeks: [], actions: [] }, legacy_invoices: [],
    } as unknown as BackendBilling
    billing.current = base
    wrap(<FacturationPage />)
    expect(screen.getByText(/Relevés indicatifs/)).toBeTruthy()
    expect(document.body.textContent).toMatch(/aucune facture n’est émise/)
  })
})
