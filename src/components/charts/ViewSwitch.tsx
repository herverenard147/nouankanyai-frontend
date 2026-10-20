import { useChartView, useChartViewStore, type ChartViewPage } from '@/store/chartViewStore'

/** Bascule entre la nouvelle vue des graphiques et l'ancienne, gardée telle quelle pour revenir en arrière. */
export function ViewSwitch({ page }: { page: ChartViewPage }) {
  const view = useChartView(page)
  const setView = useChartViewStore((s) => s.setView)
  return (
    <fieldset className="flex border border-border">
      <legend className="sr-only">Vue des graphiques</legend>
      {(
        [
          ['nouvelle', 'Nouvelle vue'],
          ['ancienne', 'Ancienne vue'],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => setView(page, id)}
          className={`focus-ring min-h-10 px-4 text-sm font-semibold ${view === id ? 'bg-dark-bg text-white' : 'bg-card text-text-primary hover:bg-bg-elevated'}`}
        >
          {label}
        </button>
      ))}
    </fieldset>
  )
}
