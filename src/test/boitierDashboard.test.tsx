import { describe, expect, it } from 'vitest'

import { connectionOf, CONNECTION_LABEL, LIGHT_SENTENCE, COMMAND_RESULT_LABEL } from '@/api/boitiers'
import { boitierDetailBlocks, boitierListColumns } from '@/lib/boitierLevels'
import { EMPTY_SITE_CHOICE, groupCode, siteChoiceReady } from '@/lib/boitierForms'
import { NAV_BY_PROFILE, isRouteAllowed } from '@/lib/navConfig'
import type { BackendSite } from '@/types/backend'

const site = (id: string): BackendSite => ({ id, nom: 'Domicile', localisation: 'Abidjan', user_id: 'u' })

describe('boîtier : navigation et accès', () => {
  it('ajoute « Boîtier » au ménage et à la PME, « Boîtiers » à l’admin, pas à l’industrie', () => {
    expect(NAV_BY_PROFILE.menage.some((e) => e.path === '/app/boitier')).toBe(true)
    expect(NAV_BY_PROFILE.pme.some((e) => e.path === '/app/boitier')).toBe(true)
    expect(NAV_BY_PROFILE.admin.some((e) => e.path === '/app/admin/boitiers')).toBe(true)
    expect(NAV_BY_PROFILE.industrie.some((e) => e.path.includes('boitier'))).toBe(false)
  })

  it('met « Boîtier » juste avant « Paramètres »', () => {
    for (const profile of ['menage', 'pme', 'admin'] as const) {
      const entries = NAV_BY_PROFILE[profile]
      const index = entries.findIndex((e) => e.label === 'Paramètres')
      expect(entries[index - 1]?.label).toMatch(/^Boîtiers?$/)
    }
  })

  it('refuse la fiche d’un boîtier aux profils qui n’ont pas la page', () => {
    expect(isRouteAllowed('/app/boitier/abc', 'pme')).toBe(true)
    expect(isRouteAllowed('/app/boitier/abc', 'industrie')).toBe(false)
    expect(isRouteAllowed('/app/admin/boitiers/abc', 'admin')).toBe(true)
    expect(isRouteAllowed('/app/admin/boitiers/abc', 'pme')).toBe(false)
  })
})

describe('boîtier : ce que chaque niveau montre', () => {
  it('liste : le débutant ne voit ni site, ni activité, ni identifiant', () => {
    expect(boitierListColumns('debutant')).toEqual({ site: false, lastActivity: false, language: false, id: false })
    expect(boitierListColumns('amateur')).toEqual({ site: true, lastActivity: true, language: false, id: false })
    expect(boitierListColumns('technique')).toEqual({ site: true, lastActivity: true, language: true, id: true })
  })

  it('détail : le ménage voit ses appareils, la PME débutante seulement la lumière et l’historique', () => {
    expect(boitierDetailBlocks('menage', 'debutant')).toMatchObject({ machines: true, chooseMachines: false, scope: false, technical: false })
    expect(boitierDetailBlocks('pme', 'debutant')).toMatchObject({ machines: false, scope: false })
    expect(boitierDetailBlocks('pme', 'amateur')).toMatchObject({ machines: true, chooseMachines: true, scope: true, auditLink: true, technical: false })
    expect(boitierDetailBlocks('pme', 'technique')).toMatchObject({ technical: true, readings: true })
  })
})

describe('boîtier : connexion, lumière, formulaires', () => {
  it('distingue en attente de connexion, en ligne et hors ligne', () => {
    expect(connectionOf({ paired: false, online: false })).toBe('en_attente')
    expect(connectionOf({ paired: true, online: true })).toBe('en_ligne')
    expect(connectionOf({ paired: true, online: false })).toBe('hors_ligne')
    expect(CONNECTION_LABEL.en_attente).toBe('En attente de connexion')
  })

  it('décrit chaque lumière par une phrase, sans chiffre', () => {
    for (const sentence of Object.values(LIGHT_SENTENCE)) expect(sentence).not.toMatch(/\d/)
    expect(LIGHT_SENTENCE.vert).toMatch(/dans leurs seuils/)
  })

  it('n’affiche « Éteint » que pour une extinction réussie', () => {
    expect(COMMAND_RESULT_LABEL.executed).toBe('Éteint')
    expect(COMMAND_RESULT_LABEL.failed).not.toBe('Éteint')
    expect(COMMAND_RESULT_LABEL.expired).not.toBe('Éteint')
  })

  it('met le code par groupes de quatre', () => {
    expect(groupCode('52FPUKP4')).toBe('52FP UKP4')
    expect(groupCode('ABC')).toBe('ABC')
  })

  it('demande un site à créer seulement quand le compte n’en a aucun', () => {
    expect(siteChoiceReady([site('1')], EMPTY_SITE_CHOICE)).toBe(true)
    expect(siteChoiceReady([], EMPTY_SITE_CHOICE)).toBe(false)
    expect(siteChoiceReady([], { siteId: '', newName: 'Domicile', newLocation: '' })).toBe(false)
    expect(siteChoiceReady([], { siteId: '', newName: 'Domicile', newLocation: 'Abidjan' })).toBe(true)
  })
})
