import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

/**
 * Lot 1 des décisions CNID du 2026-11-10 (DECISIONS_CNID_2026-11-10.md) : chaque phrase de l'accueil doit être
 * vérifiable. S-03 (faux « ×2 »), D4 (prix du kWh sans source), D5 (« IA prédictive »), D6 (concurrence nommée),
 * D8 (ménage en accès anticipé), D9 (pas d'essai industrie), D10 (formules gratuites pendant le pilote), D11 (boîtier
 * prototype), N-15 (CSP et textures 3D), D18 (période réelle de la facture).
 */

vi.mock('@/hooks/queries/useSites', () => ({ useSites: () => ({ isSuccess: true, data: [] }) }))
vi.mock('@/hooks/queries/useBoitiers', () => ({
  useBoitierMutations: () => ({ request: { mutateAsync: vi.fn() } }),
  useBoitierPrice: () => ({
    data: {
      unit_price_fcfa: 170000,
      currency: 'FCFA',
      materiels: [
        { kind: 'vocal', nom: 'Boîtier qui parle', description: 'Pour la maison', prix_fcfa: 170000, lignes: [], non_compris: [] },
        { kind: 'capteur', nom: 'Capteur d’un appareil', description: 'Mesure un appareil', prix_fcfa: 55000, lignes: [], non_compris: [] },
      ],
    },
  }),
}))

import vercelJson from '../../vercel.json?raw'

import { RequestBoitierModal } from '@/components/boitier/RequestBoitierModal'
import { LANDING_CHARTS } from '@/data/landingCharts'
import { formatBillPeriod } from '@/lib/formatters'
import { AboutSection } from '@/pages/landing/sections/AboutSection'
import { FaqSection } from '@/pages/landing/sections/FaqSection'
import { PricingSection } from '@/pages/landing/sections/PricingSection'
import { ProfilesSection } from '@/pages/landing/sections/ProfilesSection'

const TARIFS_MOYENNE_TENSION = { creuses: 57.17, pleines: 69.09, pointe: 94.21 } // backend/ml/tariffs.py

function texteDe(element: React.ReactElement): string {
  const { container, unmount } = render(<MemoryRouter>{element}</MemoryRouter>)
  const text = container.textContent ?? ''
  unmount()
  return text
}

describe('chiffres de l’accueil', () => {
  it('écart horaire recalculé depuis la grille moyenne tension : ×1,65, pas ×2', () => {
    const ecart = LANDING_CHARTS.find((chart) => chart.id === 'ecart')
    const { creuses, pleines, pointe } = TARIFS_MOYENNE_TENSION
    expect(ecart?.bars.map((bar) => bar.value)).toEqual([creuses, pleines, pointe])
    expect(ecart?.headline).toBe(`×${(pointe / creuses).toFixed(2).replace('.', ',')}`)
    expect(ecart?.headline).toBe('×1,65')
    expect(ecart?.source).toMatch(/ANARE-CI/)
    expect(ecart?.source).toMatch(/2019/)
  })

  it('prix du kWh : plus de « 79 → 87 » sans source, le prix lu sur une vraie facture CIE', () => {
    const tarif = LANDING_CHARTS.find((chart) => chart.id === 'tarif')
    expect(tarif?.headline).not.toMatch(/79|73/)
    expect(tarif?.bars.map((bar) => bar.value)).toEqual([94.94, 80.74])
    expect(tarif?.label).toMatch(/HT/)
    expect(tarif?.source).toMatch(/facture CIE/i)
    expect(tarif?.source).toMatch(/2023/)
  })
})

describe('textes de l’accueil', () => {
  it('« IA prédictive » retirée, le vrai travail décrit (D5)', () => {
    const text = texteDe(<AboutSection />)
    expect(text).not.toMatch(/prédicti/i)
    expect(text).toMatch(/analyse statistique de la consommation/)
    expect(text).toMatch(/lecture automatique de la facture/)
    expect(text).toMatch(/masquage des données personnelles/)
    // Pas de société créée (D2) : on ne se dit pas « entreprise ».
    expect(text).not.toMatch(/entreprise ivoirienne/i)
  })

  it('ménage : plus de « Bientôt disponible » ni « ensuite », accès anticipé gratuit pendant le pilote (D8)', () => {
    const text = texteDe(<ProfilesSection />) + texteDe(<FaqSection />) + texteDe(<PricingSection />)
    expect(text).not.toMatch(/Bientôt disponible/)
    expect(text).not.toMatch(/Ménage ensuite|ménages ensuite/i)
    expect(text).toMatch(/accès anticipé/i)
    expect(text).toMatch(/crédit sera épuisé/)
  })

  it('industrie : un seul bouton « Demander un audit », plus d’essai vide (D9)', () => {
    render(
      <MemoryRouter>
        <PricingSection />
      </MemoryRouter>,
    )
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).not.toContain('/login?mode=signup&type=industrie&trial=1')
    expect(hrefs).toContain('/demander-un-audit?type=industrie')
  })

  it('Essentiel et Optimum : gratuits pendant la phase pilote, sans prix affiché (D10)', () => {
    const text = texteDe(<PricingSection />)
    expect(text).toMatch(/gratuits pendant la phase pilote, paiement non encore ouvert/)
    expect(text).not.toMatch(/2 900|7 900/)
  })

  it('FAQ alignée sur le code : pas de capteurs financés, économies tirées des factures, concurrents nommés (S-09, D6)', () => {
    const text = texteDe(<FaqSection />)
    expect(text).not.toMatch(/finance les capteurs/)
    expect(text).not.toMatch(/Pas d’estimation/)
    expect(text).toMatch(/factures CIE validées/)
    for (const nom of ['Smart Energy', 'EDF', 'Conergies', 'ColdHubs', 'Koolboks']) expect(text).toContain(nom)
  })

  it('aucun tiret long dans les textes touchés', () => {
    const text = texteDe(<AboutSection />) + texteDe(<FaqSection />) + texteDe(<PricingSection />) + texteDe(<ProfilesSection />)
    expect(text).not.toContain('—')
  })
})

describe('boîtier qui parle (D11)', () => {
  it('le boîtier vocal ne se commande plus : prototype, disponible après le pilote', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RequestBoitierModal profile="menage" onClose={() => {}} />
      </QueryClientProvider>,
    )
    const dialog = screen.getByRole('dialog')
    const vocal = within(dialog).getByRole('radio', { name: /Boîtier qui parle/ })
    expect(vocal).toBeDisabled()
    expect(vocal).not.toBeChecked()
    expect(within(dialog).getByText(/Prototype, non commercialisé/)).toBeTruthy()
    expect(within(dialog).getByText(/Disponible après le pilote/)).toBeTruthy()
    expect(within(dialog).getByRole('radio', { name: /Capteur d’un appareil/ })).toBeChecked()
  })
})

describe('période de la facture (D18)', () => {
  it('bimestrielle : les deux mois couverts et la période imprimée sur la facture CIE', () => {
    expect(formatBillPeriod('2023-10', 2, '2023-12')).toBe('oct.-nov. 2023, facture CIE 12/2023')
    expect(formatBillPeriod('2023-12', 2, '2024-02')).toBe('déc. 2023-janv. 2024, facture CIE 02/2024')
    expect(formatBillPeriod('2023-10', 2, null)).toBe('oct.-nov. 2023')
  })

  it('un seul mois : le mois en clair, la période imprimée seulement si elle diffère', () => {
    expect(formatBillPeriod('2026-08', 1, null)).toBe('août 2026')
    expect(formatBillPeriod('2026-08', 1, '2026-08')).toBe('août 2026')
    expect(formatBillPeriod('Facture ancienne', 1, null)).toBe('Facture ancienne')
  })
})

describe('politique de sécurité du site (N-15)', () => {
  it('autorise blob: dans connect-src : sinon les textures 3D du boîtier ne se chargent pas en ligne', () => {
    const vercel = JSON.parse(vercelJson) as {
      headers: { headers: { key: string; value: string }[] }[]
    }
    const csp = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy')?.value ?? ''
    const connect = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('connect-src')) ?? ''
    expect(connect.split(/\s+/)).toContain('blob:')
  })
})
