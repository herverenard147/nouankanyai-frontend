import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Deux vues de la Prédiction (2026-10-20) : « Mesuré et prévu » (une courbe : relevés puis prévision) et
 * « Prévision par appareil » (la vue d'avant, une courbe par appareil). Le propriétaire garde les deux ; Conso & coûts
 * n'a plus que la nouvelle vue. Le choix est gardé dans ce navigateur.
 */
export type ChartView = 'nouvelle' | 'ancienne'
export type ChartViewPage = 'prediction'

interface ChartViewState {
  byPage: Partial<Record<ChartViewPage, ChartView>>
  setView: (page: ChartViewPage, view: ChartView) => void
}

export const useChartViewStore = create<ChartViewState>()(
  persist(
    (set) => ({
      byPage: {},
      setView: (page, view) => set((state) => ({ byPage: { ...state.byPage, [page]: view } })),
    }),
    { name: 'nouankany-vue-graphiques' },
  ),
)

/** La valeur elle-même, pas une fonction (voir le piège zustand dans CLAUDE.md). */
export function useChartView(page: ChartViewPage): ChartView {
  return useChartViewStore((s) => s.byPage[page] ?? 'nouvelle')
}
