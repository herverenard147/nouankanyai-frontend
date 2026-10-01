import { describe, expect, it } from 'vitest'

import { industrieOverviewBlocks } from '@/lib/overviewLevels'
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
