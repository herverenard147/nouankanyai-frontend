import { useState } from 'react'

import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { onEnterOrSpace } from '@/lib/a11y'

export interface ChartBar {
  key: string
  x: string
  percent: number
  tip: string
}

type Size = 'landing' | 'dashboard' | 'dashboardMobile' | 'compact'

interface BarChartProps {
  bars: ChartBar[]
  yTicks: string[]
  size: Size
  yAxisLabel?: string
  xAxisLabel?: string
  sourceLabel?: string
  gapPx?: number
  footerNote?: string
  /** N'affiche qu'une étiquette d'abscisse sur N (graphique dense, ex. 24 barres horaires). Le libellé
   * complet reste lu par les lecteurs d'écran (aria-label) et dans l'infobulle. */
  xLabelEvery?: number
}

const SIZE_CONFIG: Record<
  Size,
  { plotHeightPx: number; xLabelBandPx: number; defaultGapPx: number; barWidthClass: string; radiusClass: string; tooltipRadiusClass: string }
> = {
  landing: {
    plotHeightPx: 140,
    xLabelBandPx: 22,
    defaultGapPx: 24,
    barWidthClass: 'flex-1 min-w-0 max-w-8',
    radiusClass: 'rounded-t-bar-landing',
    tooltipRadiusClass: 'rounded-tooltip-landing',
  },
  dashboard: {
    plotHeightPx: 186,
    xLabelBandPx: 26,
    defaultGapPx: 14,
    // max-w ajouté (30 sept) : sans plafond, une barre unique (peu de relevés,
    // ex. un compte tout juste créé) s'étire sur toute la largeur du graphique
    // et écrase visuellement les graduations — même principe déjà appliqué
    // côté landing (max-w-8).
    barWidthClass: 'flex-1 min-w-0 max-w-16',
    radiusClass: 'rounded-t-bar-dashboard',
    tooltipRadiusClass: 'rounded-tooltip-dashboard',
  },
  // Aperçu des vues d'ensemble : un graphique par écran, sans légende d'axes (la valeur
  // exacte reste dans l'infobulle au survol/toucher).
  compact: {
    plotHeightPx: 104,
    xLabelBandPx: 20,
    defaultGapPx: 3,
    barWidthClass: 'flex-1 min-w-0',
    radiusClass: 'rounded-t-bar-landing',
    tooltipRadiusClass: 'rounded-tooltip-landing',
  },
  dashboardMobile: {
    plotHeightPx: 126,
    xLabelBandPx: 22,
    defaultGapPx: 7,
    barWidthClass: 'flex-1 min-w-0 max-w-12',
    radiusClass: 'rounded-t-bar-mobile',
    tooltipRadiusClass: 'rounded-tooltip-mobile',
  },
}

/**
 * Grammaire de graphique commune à la landing et au dashboard : axes gradués,
 * cadre, infobulle au survol (desktop) et au clic/toucher (pin, pour mobile).
 * L'état de survol/épinglage est local à chaque instance — contrairement à la
 * maquette d'origine où il était partagé entre les 3 graphiques de la landing.
 */
export function BarChart({
  bars,
  yTicks,
  size,
  yAxisLabel,
  xAxisLabel,
  sourceLabel,
  gapPx,
  footerNote,
  xLabelEvery = 1,
}: BarChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const config = SIZE_CONFIG[size]
  const activeKey = pinned ?? hovered
  const gap = gapPx ?? config.defaultGapPx

  return (
    <div className="flex flex-col gap-2">
      <div className="flex" style={{ gap: 12, paddingTop: 14, borderTop: '1px solid var(--color-border)' }}>
        <div
          className="flex shrink-0 flex-col items-end justify-between"
          style={{ height: config.plotHeightPx, paddingBottom: config.xLabelBandPx }}
        >
          {yTicks.map((tick, i) => (
            <span key={i} className="font-mono text-mono-axis text-text-tertiary">
              {tick}
            </span>
          ))}
        </div>
        <div
          className="flex flex-1 items-end justify-evenly border-b border-l border-border px-3"
          style={{ height: config.plotHeightPx, paddingBottom: config.xLabelBandPx, gap }}
        >
          {bars.map((bar, index) => {
            const isActive = activeKey === bar.key
            return (
              <div
                key={bar.key}
                role="button"
                tabIndex={0}
                aria-label={`${bar.x} : ${bar.tip}`}
                className={`focus-ring relative flex h-full cursor-pointer flex-col items-center justify-end ${config.barWidthClass}`}
                onMouseEnter={() => setHovered(bar.key)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setPinned((prev) => (prev === bar.key ? null : bar.key))}
                onKeyDown={onEnterOrSpace(() => setPinned((prev) => (prev === bar.key ? null : bar.key)))}
              >
                <ChartTooltip text={bar.tip} visible={isActive} radiusClassName={config.tooltipRadiusClass} />
                <div
                  className={`w-full transition-colors duration-100 ease-out ${config.radiusClass}`}
                  style={{
                    height: `${bar.percent}%`,
                    backgroundColor: isActive ? 'var(--color-accent-cta)' : 'var(--color-accent)',
                  }}
                />
                {index % xLabelEvery === 0 && (
                  <span
                    className="absolute left-1/2 whitespace-nowrap font-mono text-mono-axis text-text-tertiary"
                    style={{ bottom: -config.xLabelBandPx + 4, transform: 'translateX(-50%)' }}
                  >
                    {bar.x}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      {size === 'landing' ? (
        <p className="font-mono text-mono-axis text-text-tertiary">
          axe des abscisses : {xAxisLabel} · source : {sourceLabel}
        </p>
      ) : size === 'compact' ? null : (
        <div className="flex flex-wrap justify-between gap-2 font-mono text-mono-axis text-text-tertiary">
          <span>axe des ordonnées : {yAxisLabel}</span>
          <span>axe des abscisses : {xAxisLabel} · survol pour la valeur</span>
        </div>
      )}
      {footerNote && <p className="text-sm text-text-secondary">{footerNote}</p>}
    </div>
  )
}
