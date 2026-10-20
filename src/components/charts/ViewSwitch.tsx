import { useChartView, useChartViewStore, type ChartViewPage } from '@/store/chartViewStore'

/** Bascule entre deux vues d'une page ; les intitulés sont donnés par la page. */
export function ViewSwitch({ page, labels }: { page: ChartViewPage; labels: { nouvelle: string; ancienne: string } }) {
  const view = useChartView(page)
  const setView = useChartViewStore((s) => s.setView)
  return (
    <fieldset className="flex border border-border">
      <legend className="sr-only">Vue</legend>
      {(['nouvelle', 'ancienne'] as const).map((id) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => setView(page, id)}
          className={`focus-ring min-h-10 px-4 text-sm font-semibold ${view === id ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
        >
          {labels[id]}
        </button>
      ))}
    </fieldset>
  )
}
