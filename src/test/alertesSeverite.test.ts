import { describe, expect, it } from 'vitest'

import { formatNumberFr } from '@/lib/formatters'
import { frenchNumbersWithUnits } from '@/lib/frenchText'
import { alertTone } from '@/lib/severity'

describe('couleur d’une alerte selon sa sévérité', () => {
  it('réserve le rouge au critique', () => {
    expect(alertTone('critique').text).toBe('text-alert')
    expect(alertTone('modérée').text).toBe('text-accent-cta')
    expect(alertTone('faible').text).toBe('text-text-secondary')
    expect(alertTone('faible').bar).not.toBe('bg-alert')
  })
})

describe('textes venus du serveur', () => {
  it('ne montre ni nom technique de mesure ni « depuis 0 relevés »', () => {
    const text = frenchNumbersWithUnits('Mesure principale : vibration_mm_s (tendance hausse, depuis 0 relevés).')
    expect(text).toBe('Mesure principale : vibration (tendance hausse).')
  })

  it('garde le nombre de relevés quand il y en a', () => {
    expect(frenchNumbersWithUnits('temperature_c (tendance stable, depuis 4 relevés)')).toBe('température (tendance stable, depuis 4 relevés)')
  })
})

describe('séparateur des milliers', () => {
  it('n’utilise plus de point', () => {
    expect(formatNumberFr(2319)).toBe('2 319')
    expect(formatNumberFr(191895)).not.toContain('.')
  })
})
