import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LineChart } from '@/components/charts/LineChart'
import { TimeChart } from '@/components/charts/TimeChart'

/**
 * Page blanche en bas de Conso & coûts (2026-10-20) : un <table class="sr-only"> garde toute sa hauteur (96 lignes du
 * pic : 2 300 px de blanc). Le tableau lu par les lecteurs d'écran doit être DANS un bloc sr-only, jamais sr-only lui-même.
 */
describe('tableaux des lecteurs d’écran', () => {
  it('TimeChart et LineChart : le tableau est dans un bloc caché', () => {
    const labels = Array.from({ length: 96 }, (_, i) => `${i}`)
    const values = labels.map(() => 1)
    const { container } = render(
      <>
        <TimeChart labels={labels} series={[{ name: 'A', values, color: 'red' }]} unit="kW" yAxisLabel="Puissance (kW)" xAxisLabel="Heure" />
        <LineChart labels={labels} series={[{ name: 'B', values }]} unit="kWh" />
      </>,
    )
    const tables = [...container.querySelectorAll('table')]
    expect(tables).toHaveLength(2)
    for (const table of tables) {
      expect(table.classList.contains('sr-only')).toBe(false)
      expect(table.parentElement?.classList.contains('sr-only')).toBe(true)
    }
  })
})
