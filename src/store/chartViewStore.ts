import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Nouvelles vues des graphiques (demande du propriétaire, 2026-10-20) : « crée ça sur le site en gardant les
 * anciennes vues, pour qu'on puisse revenir en arrière ». Le choix est gardé dans ce navigateur, page par page.
 */
export type ChartView = 'nouvelle' | 'ancienne'
export type ChartViewPage = 'consommation' | 'prediction'

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
