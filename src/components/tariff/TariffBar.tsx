interface TariffBarProps {
  nowLabel?: string
  compact?: boolean
  showLabels?: boolean
}

const SEGMENTS = [
  { key: 'creuses', label: 'Creuses', flex: 1.3, colorVar: '--color-tariff-creuses' },
  { key: 'pleines', label: 'Pleines', flex: 1.6, colorVar: '--color-tariff-pleines' },
  { key: 'pointe', label: 'Pointe', flex: 1, colorVar: '--color-tariff-pointe' },
] as const

/** Barre de paliers tarifaires CIE — signature visuelle récurrente du produit. */
export function TariffBar({ nowLabel, compact, showLabels = true }: TariffBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className={`flex overflow-hidden rounded-tariff border border-border ${compact ? 'h-7' : 'h-[34px]'}`}
        role="img"
        aria-label="Barre de paliers tarifaires CIE : heures creuses, heures pleines, heures de pointe"
      >
        {SEGMENTS.map((segment) => (
          <div
            key={segment.key}
            className="flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap font-mono text-mono-axis font-semibold text-text-secondary"
            style={{ flex: segment.flex, backgroundColor: `var(${segment.colorVar})` }}
          >
            {showLabels && !compact && segment.label}
          </div>
        ))}
      </div>
      {nowLabel && <p className="font-mono text-mono-axis text-text-tertiary">{nowLabel}</p>}
    </div>
  )
}
