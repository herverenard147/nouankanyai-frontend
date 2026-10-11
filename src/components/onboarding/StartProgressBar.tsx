/** Barre d'avancement des premiers pas : la largeur s'anime quand une étape se coche. */
export function StartProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-label={`${done} étape${done > 1 ? 's' : ''} sur ${total}`}
      className="h-1.5 w-full bg-bg-elevated"
    >
      <div className="h-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
    </div>
  )
}
