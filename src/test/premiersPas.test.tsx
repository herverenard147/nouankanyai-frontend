import { describe, expect, it } from 'vitest'

import { STEPS_BY_PROFILE, startProgress } from '@/lib/gettingStarted'
import { NAV_BY_PROFILE, isRouteAllowed } from '@/lib/navConfig'
import type { Profile } from '@/types/domain'

const PROFILES: Profile[] = ['menage', 'pme', 'industrie', 'admin']

describe('Premiers pas', () => {
  it('chaque type de compte a ses étapes, chacune avec une explication et une page qu’il peut ouvrir', () => {
    for (const profile of PROFILES) {
      const steps = STEPS_BY_PROFILE[profile]
      expect(steps.length).toBeGreaterThanOrEqual(5)
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length)
      for (const step of steps) {
        expect(step.what.length).toBeGreaterThan(30)
        expect(isRouteAllowed(step.to, profile), `${profile} : ${step.to}`).toBe(true)
        expect(NAV_BY_PROFILE[profile].some((entry) => entry.path === step.to), `${profile} : ${step.to} dans le menu`).toBe(true)
      }
    }
  })

  it('la page est dans le menu de chaque profil, juste après la vue d’ensemble', () => {
    for (const profile of PROFILES) {
      expect(NAV_BY_PROFILE[profile][0].path).toBe('/app/apercu')
      expect(NAV_BY_PROFILE[profile][1]).toEqual({ path: '/app/premiers-pas', label: 'Premiers pas' })
    }
  })

  it('un compte neuf n’a aucune étape cochée d’office', () => {
    for (const profile of PROFILES) {
      const progress = startProgress(profile, {}, [])
      expect(progress.doneCount).toBe(0)
      expect(progress.next?.id).toBe(STEPS_BY_PROFILE[profile][0].id)
    }
  })

  it('coche une étape d’après les données du compte, pas d’après un clic', () => {
    const facts = { emailConfirme: true, sites: 1, appareils: 3, factures: 0, boitiers: 0, membres: 1 }
    const progress = startProgress('pme', facts, ['facture'])
    const done = progress.steps.filter((s) => s.done).map((s) => s.id)
    expect(done).toEqual(['email', 'site', 'appareils'])
    // Ouvrir la page des factures ne suffit pas : il faut une facture. Le titulaire seul n'est pas une équipe.
    expect(progress.next?.id).toBe('facture')
  })

  it('une étape sans donnée mesurable se coche quand sa page a été ouverte', () => {
    const progress = startProgress('menage', {}, ['prediction'])
    expect(progress.steps.find((s) => s.id === 'prediction')?.done).toBe(true)
    expect(progress.steps.find((s) => s.id === 'conseils')?.done).toBe(false)
  })

  it('tout est fait : plus de prochaine étape', () => {
    const facts = { emailConfirme: true, sites: 1, appareils: 1, factures: 1, boitiers: 1, membres: 2 }
    const progress = startProgress('industrie', facts, STEPS_BY_PROFILE.industrie.map((s) => s.id))
    expect(progress.next).toBeNull()
    expect(progress.doneCount).toBe(progress.total)
  })
})

// Partie H1 : les indicateurs du Ménage parlaient de « machines » et d'« anomalie ».
describe('Vocabulaire du Ménage', () => {
  it('parle d’appareils, pas de machines ; les autres profils gardent leurs mots', async () => {
    const { kpiIdsFor, kpiMeta } = await import('@/api/kpis')
    const labels = (profile: Profile) => kpiIdsFor(profile).map((id) => kpiMeta(profile, id).label)
    expect(labels('menage').join(' ')).not.toMatch(/machine|anomalie|puissance active/i)
    expect(labels('menage')).toContain('Appareils à surveiller')
    expect(labels('pme')).toContain('Machines en anomalie')
    expect(labels('industrie')).toEqual(labels('pme'))
  })
})
