import { describe, expect, it } from 'vitest'

import { auditColumns } from '@/lib/auditLevels'
import { planBlocks } from '@/lib/planLevels'
import { adminOverviewBlocks, industrieOverviewBlocks, kpiTargets, menageOverviewBlocks, pmeOverviewBlocks } from '@/lib/overviewLevels'
import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { NAV_ICONS } from '@/lib/navIcons'
import type { Level } from '@/types/domain'

describe('vue d’ensemble Industrie : ce que chaque niveau change', () => {
  it('technique : relevés capteur, ligne du modèle, plan d’action et historique', () => {
    expect(industrieOverviewBlocks('technique')).toEqual({
      machineColumns: 'full',
      showModelDetails: true,
      shortcuts: ['plan-action', 'resolutions', 'paliers'],
    })
  })

  it.each<Level>(['amateur', 'debutant'])('%s : aucun relevé brut ni plan d’action, les conseils en raccourci', (level) => {
    const blocks = industrieOverviewBlocks(level)
    expect(blocks.machineColumns).toBe('base')
    expect(blocks.showModelDetails).toBe(false)
    expect(blocks.shortcuts).toEqual(['conseils', 'paliers'])
  })
})

describe('navigation', () => {
  it('chaque entrée de chaque profil a une icône (plus de lettres)', () => {
    for (const entries of Object.values(NAV_BY_PROFILE)) {
      for (const entry of entries) {
        expect(NAV_ICONS[entry.path], `icône manquante pour ${entry.path}`).toBeDefined()
      }
    }
  })
})

describe('vue d’ensemble PME', () => {
  it('débutant : Catégorie, Site, Statut seulement', () => {
    expect(pmeOverviewBlocks('debutant').equipmentColumns).toBe('base')
    expect(pmeOverviewBlocks('debutant').shortcuts).toEqual(['conseils', 'recommandations', 'factures', 'paliers'])
  })

  it('amateur : + marque, modèle, priorité', () => {
    expect(pmeOverviewBlocks('amateur').equipmentColumns).toBe('full')
    expect(pmeOverviewBlocks('amateur').shortcuts).not.toContain('plan-action')
  })

  it('technique : + raccourci Plan d’action en tête', () => {
    expect(pmeOverviewBlocks('technique').equipmentColumns).toBe('full')
    expect(pmeOverviewBlocks('technique').shortcuts[0]).toBe('plan-action')
  })
})

describe('vue d’ensemble Ménage et Admin', () => {
  it('Ménage : la commission est un raccourci (il paie selon ses économies)', () => {
    expect(menageOverviewBlocks().shortcuts).toEqual(['conseils', 'recommandations', 'commission', 'paliers'])
  })

  it('Admin : le nom du modèle n’apparaît qu’au niveau technique', () => {
    expect(adminOverviewBlocks('technique').showModelName).toBe(true)
    expect(adminOverviewBlocks('amateur').showModelName).toBe(false)
    expect(adminOverviewBlocks('debutant').showModelName).toBe(false)
  })

  it('aucun profil client ne montre le nom du modèle', () => {
    expect(industrieOverviewBlocks('technique')).not.toHaveProperty('showModelName')
    expect(pmeOverviewBlocks('technique')).not.toHaveProperty('showModelName')
  })

  it('chaque indicateur clé de chaque profil mène à une page', () => {
    for (const profile of ['menage', 'pme', 'industrie', 'admin'] as const) {
      expect(Object.keys(kpiTargets(profile))).toHaveLength(4)
    }
  })
})

describe('Audit : colonnes par niveau', () => {
  it('débutant : Heure, Action, Détail', () => {
    expect(auditColumns('debutant', false)).toEqual(['time', 'action', 'detail'])
  })
  it('amateur : + Acteur', () => {
    expect(auditColumns('amateur', false)).toEqual(['time', 'actor', 'action', 'detail'])
  })
  it('technique : + Source (et donc export CSV)', () => {
    expect(auditColumns('technique', false)).toEqual(['time', 'actor', 'action', 'detail', 'source'])
  })
  it('Admin : + colonne Compte', () => {
    expect(auditColumns('technique', true)).toContain('account')
    expect(auditColumns('debutant', true)).toEqual(['time', 'account', 'action', 'detail'])
  })
})

describe('Plan d’action : historique des résolutions', () => {
  it('réservé au niveau technique', () => {
    expect(planBlocks('technique').showResolutions).toBe(true)
    expect(planBlocks('amateur').showResolutions).toBe(false)
    expect(planBlocks('debutant').showResolutions).toBe(false)
  })
})

describe('navigation par profil (DESIGN.md §4)', () => {
  const labels = (profile: keyof typeof NAV_BY_PROFILE) => NAV_BY_PROFILE[profile].map((entry) => entry.label)

  it('Audit pour PME, Industrie et Admin, jamais pour le Ménage', () => {
    expect(labels('pme')).toContain('Audit')
    expect(labels('industrie')).toContain('Audit')
    expect(labels('admin')).toContain('Audit')
    expect(labels('menage')).not.toContain('Audit')
  })
  it('Plan d’action pour PME et Industrie seulement', () => {
    expect(labels('pme')).toContain("Plan d'action")
    expect(labels('industrie')).toContain("Plan d'action")
    expect(labels('menage')).not.toContain("Plan d'action")
    expect(labels('admin')).not.toContain("Plan d'action")
  })
  it('Commission aussi pour le Ménage (il paie selon ses économies)', () => {
    expect(labels('menage')).toContain('Commission')
  })
  it('le Journal est conservé (ce n’est pas un audit)', () => {
    expect(labels('industrie')).toContain('Journal')
    expect(labels('admin')).toContain('Journal')
  })
})
