import { describe, expect, it } from 'vitest'

import { readableMessage } from '@/lib/apiClient'
import { LIMITS, isValidEmail, maxBillMonth } from '@/lib/validation'

// Recherche de défauts du 2026-10-12 : les formulaires laissaient partir un courriel « abc » ou un
// texte démesuré, et le refus du serveur s'affichait en « valeur invalide ».
describe('Contrôles de saisie des formulaires', () => {
  it('un courriel doit être complet', () => {
    for (const bad of ['abc', 'a@b', 'a b@c.d', '@c.d', '']) expect(isValidEmail(bad)).toBe(false)
    expect(isValidEmail('  awa@exemple.ci ')).toBe(true)
  })

  it('une facture se saisit au plus deux mois à venir', () => {
    expect(maxBillMonth(new Date(2026, 9, 12))).toBe('2026-12')
    expect(maxBillMonth(new Date(2026, 11, 1))).toBe('2027-02')
  })

  it('les limites sont celles du serveur', () => {
    expect(LIMITS).toMatchObject({ name: 200, message: 5000, assistantMessage: 4000, powerKw: 100_000 })
  })
})

describe('Refus du serveur dits en français, avec la limite', () => {
  const text = (item: object) => readableMessage([item])

  it('longueur dépassée', () => {
    expect(text({ type: 'string_too_long', loc: ['body', 'message'], ctx: { max_length: 5000 } })).toBe(`Message : 5${' '}000 caractères au plus.`)
  })

  it('règle écrite côté serveur', () => {
    expect(text({ type: 'value_error', loc: ['body', 'email'], msg: 'Value error, Adresse email invalide' })).toBe('Adresse email : Adresse email invalide.')
    expect(text({ type: 'value_error', loc: ['body', 'month'], msg: 'Value error, Ce mois est trop loin dans le futur pour une facture.' })).toBe('Mois : Ce mois est trop loin dans le futur pour une facture.')
  })

  it('nombre hors bornes', () => {
    expect(text({ type: 'greater_than_equal', loc: ['body', 'actual_amount_xof'], ctx: { ge: 0 } })).toBe('Montant réel : doit être au moins 0.')
    expect(text({ type: 'less_than_equal', loc: ['body', 'amount_xof'], ctx: { le: 100000000000 } })).toContain('Montant : doit être au plus 100')
  })

  it('un type inconnu reste lisible', () => {
    expect(text({ type: 'autre', loc: ['body', 'champ_inconnu'] })).toBe('champ_inconnu : valeur invalide.')
  })
})

describe('Message d’un champ invalide, écrit par nous', () => {
  function input(attrs: Record<string, string>, value: string) {
    const el = document.createElement('input')
    for (const [name, v] of Object.entries(attrs)) el.setAttribute(name, v)
    el.value = value
    return el
  }

  it('champ obligatoire, courriel incomplet, nombre hors bornes', async () => {
    const { frenchValidityMessage, FRENCH_VALIDITY, EMAIL_INPUT } = await import('@/lib/validation')
    expect(frenchValidityMessage(input({ required: '' }, ''))).toBe('Ce champ est obligatoire.')
    expect(frenchValidityMessage(input({ type: 'email', pattern: EMAIL_INPUT.pattern }, 'abc@def'))).toContain('adresse email complète')
    expect(frenchValidityMessage(input({ type: 'number', min: '0' }, '-5'))).toBe('La valeur doit être au moins 0.')
    expect(frenchValidityMessage(input({ type: 'number', max: '100000' }, '900000'))).toContain('au plus 100')
    expect(frenchValidityMessage(input({ type: 'text' }, 'correct'))).toBe('')

    const field = input({ required: '' }, '')
    FRENCH_VALIDITY.onInvalid({ currentTarget: field })
    expect(field.validationMessage).toBe('Ce champ est obligatoire.')
    field.value = 'Awa'
    FRENCH_VALIDITY.onInput({ currentTarget: field })
    expect(field.checkValidity()).toBe(true)
  })
})

describe('Machine en alerte sans diagnostic détaillé', () => {
  it('figure dans la liste des alertes, une seule fois', async () => {
    const { pendingDiagnosisAlerts } = await import('@/api/alerts')
    const machines = [
      { machine_id: 'M1', nom: 'Four de séchage', status: 'alerte' },
      { machine_id: 'M2', nom: 'Compresseur', status: 'alerte' },
      { machine_id: 'M3', nom: 'Groupe froid', status: 'actif' },
    ] as Parameters<typeof pendingDiagnosisAlerts>[0]
    const alerts = pendingDiagnosisAlerts(machines, new Set(['M2']))
    expect(alerts.map((a) => a.machineId)).toEqual(['M1'])
    expect(alerts[0].title).toBe('Anomalie signalée sur Four de séchage')
    expect(alerts[0].detail).toContain('quelques relevés')
  })
})
