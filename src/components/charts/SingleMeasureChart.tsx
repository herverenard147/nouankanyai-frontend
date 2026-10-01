interface SingleMeasureChartProps {
  /** Libellé horaire de la mesure unique, « HH:MM ». */
  label: string
  /** Hauteur de la barre, 0 à 100. */
  percent: number
  tip: string
}

/**
 * Graphique horaire quand un seul relevé existe : 24 créneaux, une barre, les autres heures vides, à largeur
 * fixe — au lieu d'une barre unique étirée sur toute la bande (DESIGN.md règle 11).
 */
export function SingleMeasureChart({ label, percent, tip }: SingleMeasureChartProps) {
  const hour = Math.min(23, Math.max(0, Number.parseInt(label.split(':')[0] ?? '0', 10) || 0))
  return (
    <figure className="flex w-full max-w-[30rem] flex-col gap-1" aria-label={`Une mesure à ${label} : ${tip}`}>
      <div className="flex h-28 gap-1 border-b border-border">
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="flex flex-1 flex-col justify-end">
            {i === hour && <div className="bg-accent" style={{ height: `${percent}%` }} title={tip} />}
          </div>
        ))}
      </div>
      <div className="flex gap-1 text-[0.625rem] text-text-tertiary" aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <span key={i} className="flex-1 text-center tabular-nums">
            {i % 6 === 0 ? i : ''}
          </span>
        ))}
      </div>
      <figcaption className="text-xs text-text-secondary">
        Heures (0 à 23). Une seule mesure enregistrée aujourd’hui, à {label}.
      </figcaption>
    </figure>
  )
}
