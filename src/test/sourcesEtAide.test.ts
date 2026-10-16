import { describe, expect, it } from 'vitest'

import { modbusOffset } from '@/api/sources'
import { ERRORS, errorHelp, errorsFor } from '@/data/aide/erreurs'
import { GUIDES } from '@/data/aide/guides'
import { NAV_ICONS } from '@/lib/navIcons'
import { NAV_BY_PROFILE, firstRouteFor, isRouteAllowed } from '@/lib/navConfig'
import { deriveProfile, isClientProfile } from '@/lib/profileMapping'
import { EMPTY_FILE_DRAFT, buildCustomMap, toMapping } from '@/lib/sourceForms'
import type { Profile } from '@/types/domain'

const PROFILES: Profile[] = ['menage', 'pme', 'industrie', 'technicien', 'admin']

describe('profil technicien', () => {
  it('vient du rôle plateforme et ne voit que ses interventions, sa documentation et ses paramètres', () => {
    expect(deriveProfile('PME', 'technicien')).toBe('technicien')
    expect(isClientProfile('technicien')).toBe(false)
    expect(NAV_BY_PROFILE.technicien.map((e) => e.path)).toEqual(['/app/interventions', '/app/aide', '/app/parametres'])
    expect(firstRouteFor('technicien')).toBe('/app/interventions')
    expect(isRouteAllowed('/app/interventions/abc/sources/def', 'technicien')).toBe(true)
    expect(isRouteAllowed('/app/apercu', 'technicien')).toBe(false)
    expect(isRouteAllowed('/app/factures', 'technicien')).toBe(false)
    expect(isRouteAllowed('/app/interventions', 'pme')).toBe(false)
  })

  it('Sources de mesures pour PME et industrie, Documentation dans le menu de tous', () => {
    for (const profile of PROFILES) expect(NAV_BY_PROFILE[profile].some((e) => e.path === '/app/aide' && e.label === 'Documentation' && !e.under)).toBe(true)
    expect(isRouteAllowed('/app/sources/x', 'pme')).toBe(true)
    expect(isRouteAllowed('/app/sources', 'industrie')).toBe(true)
    expect(isRouteAllowed('/app/sources', 'menage')).toBe(false)
    for (const profile of PROFILES) expect(isRouteAllowed('/app/aide', profile)).toBe(true)
    for (const path of ['/app/sources', '/app/aide', '/app/interventions']) expect(NAV_ICONS[path]).toBeDefined()
  })
})

describe('documentation de chaque acteur', () => {
  it('un guide par profil, chacun différent', () => {
    const titles = PROFILES.map((p) => GUIDES[p].title)
    expect(new Set(titles).size).toBe(PROFILES.length)
    const ids = (p: Profile) => GUIDES[p].sections.map((s) => s.id)
    expect(ids('technicien')).toEqual(expect.arrayContaining(['regles', 'menage', 'node-red', 'passerelle', 'autre-compteur', 'essai', 'logiciel', 'fichiers', 'verifier']))
    expect(ids('menage')).not.toContain('autre-compteur')
    expect(ids('menage')).toContain('boitier')
    expect(ids('pme')).toEqual(expect.arrayContaining(['sources', 'contrat', 'acces-technicien']))
    expect(ids('industrie')).toEqual(expect.arrayContaining(['passerelle', 'seuils', 'contrat']))
    expect(ids('admin')).toEqual(expect.arrayContaining(['roles', 'boitiers']))
  })

  it('les ancres utilisées par les écrans existent dans le guide du profil concerné', () => {
    const has = (p: Profile, id: string) => GUIDES[p].sections.some((s) => s.id === id)
    expect(has('technicien', 'logiciel') && has('technicien', 'regles')).toBe(true)
    for (const p of ['pme', 'industrie'] as Profile[]) expect(has(p, 'contrat') && has(p, 'acces-technicien')).toBe(true)
    expect(has('menage', 'acces-technicien')).toBe(true)
  })

  it('chaque fiche d’erreur est unique, complète et destinée à au moins un profil', () => {
    expect(new Set(ERRORS.map((e) => e.id)).size).toBe(ERRORS.length)
    for (const e of ERRORS) {
      expect(e.audiences.length).toBeGreaterThan(0)
      expect(e.meaning.length).toBeGreaterThan(10)
      expect(e.fix.length).toBeGreaterThan(0)
    }
    for (const p of PROFILES) expect(errorsFor(p).length).toBeGreaterThan(5)
  })

  // Messages réels du serveur (backend/app/api/v1/boitier/router.py, intervention/router.py, app/boitier/meters.py,
  // file_source.py, ingest.py), recopiés tels quels : chacun doit trouver sa fiche pour le technicien.
  it.each([
    "Code d'appairage invalide ou expiré",
    'Boîtier inconnu ou secret invalide',
    'Jeton invalide ou expiré',
    'Adresse réseau du compteur requise en Modbus-TCP.',
    'Fonction Modbus : 3 (registres de maintien) ou 4 (registres d\'entrée).',
    'power_kw : adresse entre 0 et 65535.',
    'Puissance de 12400 kW pour un appareil de 18 kW : des W lus comme des kW ? (facteur 0,001).',
    'Puissance de 40 kW pour un appareil de 18 kW.',
    'Puissance négative (-3.2 kW) : sens du tore ou du câblage inversé ?.',
    'Tension de 23100 V hors de 90 à 480 V : registre ou facteur à revoir.',
    'Ni puissance ni énergie lue : rien d\'utilisable pour les calculs.',
    'Colonnes pas encore réglées : le technicien doit d\'abord les indiquer sur la plateforme.',
    "La colonne « P (W) » n'existe pas dans le fichier.",
    'Unité de la puissance : W, kW ou MW.',
    'nom « POMPE_9 » non relié à un appareil : ajoutez la correspondance sur la plateforme',
    'puissance de 19000 kW incohérente pour un appareil de 18 kW : unité attendue kW (des W ?)',
    'date illisible (exemple : 2026-09-01 08:00)',
    'date dans le futur',
    'mesure de plus de 30 jours',
    'vibration_mm_s hors bornes (130.0)',
    'mesure déjà reçue',
    'premier index de cet appareil : sert de point de départ',
    'index plus petit que le précédent, ou même date : compteur remis à zéro ?',
    "« N/A » n'est pas un nombre",
    "Le client n'a pas accordé d'accès technicien, ou il a expiré.",
    'Trop de tentatives. Réessayez dans 3 minute(s).',
  ])('« %s » a sa fiche', (message) => {
    expect(errorHelp(message, 'technicien')).toBeDefined()
  })

  it('« Que faire ? » distingue la puissance trop forte de l’erreur W/kW, et ne montre pas une fiche technicien à un ménage', () => {
    expect(errorHelp('Puissance de 12400 kW pour un appareil de 18 kW : des W lus comme des kW ? (facteur 0,001).', 'pme')?.id).toBe('essai-watts')
    expect(errorHelp('Puissance de 40 kW pour un appareil de 18 kW.', 'pme')?.id).toBe('essai-trop-fort')
    expect(errorHelp('Jeton invalide ou expiré', 'menage')).toBeUndefined()
    expect(errorHelp("Seul le titulaire du compte peut accorder ou retirer l'accès technicien.", 'pme')?.id).toBe('titulaire-seul')
  })
})

describe('formulaires des sources', () => {
  it('convertit une adresse de notice en adresse Modbus comptée depuis 0', () => {
    expect(modbusOffset(30053)).toEqual({ address: 52, function: 4 })
    expect(modbusOffset(40001)).toEqual({ address: 0, function: 3 })
    expect(modbusOffset(52)).toBeNull()
  })

  it('table d’un « autre compteur » : conversion, facteur à la française, contrôles', () => {
    const map = buildCustomMap(3, 'float32', { power_kw: { address: '30053', scale: '0,001' }, power_factor: { address: '30063', scale: '' } })
    expect(map).toEqual({
      function: 4,
      data_type: 'float32',
      registers: { power_kw: { address: 52, scale: 0.001, abs: false }, power_factor: { address: 62, scale: 1, abs: true } },
    })
    expect(buildCustomMap(4, 'int32', { voltage_v: { address: '0', scale: '0,1' } })).toMatch(/puissance ou l’énergie/)
    expect(buildCustomMap(4, 'int32', { power_kw: { address: '30053', scale: '' }, energy_kwh: { address: '40001', scale: '' } })).toMatch(/3xxxx et 4xxxx/)
    expect(buildCustomMap(4, 'int32', { power_kw: { address: '12', scale: '0' } })).toMatch(/facteur positif/)
  })

  it('réglage d’un fichier : unités dites, jamais devinées', () => {
    const mapping = toMapping({ ...EMPTY_FILE_DRAFT, date_column: 'Horodatage', appliance_column: 'Equipement', power_column: 'P (W)', power_unit: 'W', pf_column: 'FP', pf_percent: true })
    expect(mapping.power).toEqual({ column: 'P (W)', unit: 'W' })
    expect(mapping.energy).toBeNull()
    expect(mapping.power_factor).toEqual({ column: 'FP', percent: true })
    const energy = toMapping({ ...EMPTY_FILE_DRAFT, date_column: 't', appliance: 'unique', machine_code: 'M1', measure: 'energy', energy_column: 'Wh', energy_unit: 'Wh', energy_kind: 'intervalle', interval_minutes: '15' })
    expect(energy.power).toBeNull()
    expect(energy.energy).toEqual({ column: 'Wh', unit: 'Wh', kind: 'intervalle', interval_minutes: 15 })
    expect(energy.machine_code).toBe('M1')
    expect(energy.appliance_column).toBeNull()
  })
})
