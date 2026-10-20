import { useEffect, useRef, useState, type ReactNode } from 'react'

import { formatNumberFr } from '@/lib/formatters'

/**
 * Courbe des « nouvelles vues » (maquettes validées par le propriétaire, 2026-10-20). Mêmes axes que les barres du
 * site : trait à gauche et en bas, graduations rondes, et sous le graphique « axe des ordonnées » et « axe des
 * abscisses ». En plus de LineChart : aire, mode empilé, fond « à venir », changement de jour marqué, noms des
 * jours au-dessus, plages horaires en fond, légende. Une période sans relevé coupe la courbe (jamais un zéro
 * inventé). Les lecteurs d'écran lisent un tableau des mêmes valeurs.
 */
export interface TimeSeries {
  name: string
  values: (number | null)[]
  /** Couleur CSS. */
  color: string
  /** line : trait ; area : trait et aire ; dashed : trait pointillé (prévision). */
  kind?: 'line' | 'area' | 'dashed'
}

export interface LegendExtra {
  label: string
  /** box : carré de couleur ; mark : petit trait vertical. */
  swatch: 'box' | 'mark'
  color: string
}

interface TimeChartProps {
  /** Libellé complet de chaque point (infobulle et tableau). */
  labels: string[]
  /** Étiquette courte sous l'axe ; `null` = rien sous ce point. Absent : une étiquette sur n, selon la place. */
  ticks?: (string | null)[]
  series: TimeSeries[]
  unit: string
  yAxisLabel: string
  xAxisLabel: string
  height?: number
  /** Séries empilées : la hauteur totale est la somme. */
  stacked?: boolean
  /** Échelle fixe (le haut de l'axe ne bouge pas quand on masque une série). */
  maxValue?: number
  /** Premier point « à venir » : fond gris à partir de là et trait « maintenant ». */
  nowIndex?: number
  /** Points où un nouveau jour commence : trait pointillé. */
  separators?: number[]
  /** Noms écrits au-dessus de la courbe (Hier, Aujourd’hui, Demain), de `from` à `to` inclus. */
  zones?: { from: number; to: number; label: string }[]
  /** Fond coloré de `from` à `to` inclus (plages horaires CIE). */
  bands?: { from: number; to: number; color: string }[]
  /** Ligne de plus dans l'infobulle (le coût, par exemple). */
  extraTip?: (index: number) => string | null
  legendExtra?: LegendExtra[]
  /** false : la page affiche sa propre légende (cases à cocher). */
  showLegend?: boolean
  /** Aucune valeur : le graphique reste affiché, vide, avec ce message au milieu (demande du propriétaire). */
  emptyMessage?: ReactNode
}

const AXIS = 'var(--color-placeholder-border)'

/** Pas « rond » : quatre pas couvrent le maximum (1, 2, 2,5, 5 × 10ⁿ), comme LineChart. */
function niceStep(max: number): number {
  if (max <= 0) return 0.25
  const power = 10 ** Math.floor(Math.log10(max / 4))
  return [1, 2, 2.5, 5, 10].map((m) => m * power).find((step) => step * 4 >= max) ?? 10 * power
}

/** Morceaux continus d'une série (une valeur absente coupe la courbe). */
function segments(values: (number | null)[]): [number, number][][] {
  const out: [number, number][][] = []
  let current: [number, number][] = []
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) out.push(current)
      current = []
    } else current.push([i, v])
  })
  if (current.length) out.push(current)
  return out
}

function Swatch({ kind, color }: { kind: 'line' | 'area' | 'dashed' | 'box' | 'mark'; color: string }) {
  if (kind === 'dashed') return <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: color }} />
  if (kind === 'box') return <span className="inline-block h-3 w-5 border border-placeholder-border" style={{ background: color }} />
  if (kind === 'mark') return <span className="inline-block h-3.5 border-l-2" style={{ borderColor: color }} />
  return <span className="inline-block h-0.5 w-5" style={{ background: color }} />
}

export function TimeChart({
  labels,
  ticks,
  series,
  unit,
  yAxisLabel,
  xAxisLabel,
  height = 260,
  stacked = false,
  maxValue,
  nowIndex,
  separators = [],
  zones = [],
  bands = [],
  extraTip,
  legendExtra = [],
  showLegend = true,
  emptyMessage,
}: TimeChartProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  // 320 au départ : une valeur plus large forçait la colonne à s'élargir sur téléphone.
  const [width, setWidth] = useState(320)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const n = Math.max(1, labels.length)
  const pad = { top: zones.length ? 30 : 12, right: 16, bottom: 26, left: 52 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const x = (i: number) => pad.left + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1))
  const bottom = pad.top + plotH

  // Empilé : bas et haut de chaque série, point par point (une valeur absente compte pour zéro dans la pile).
  const stackedLayers = stacked
    ? (() => {
        const cum = new Array<number>(n).fill(0)
        return series.map((s) => {
          const low = cum.slice()
          const high = low.map((v, i) => v + (s.values[i] ?? 0))
          high.forEach((v, i) => (cum[i] = v))
          return { low, high }
        })
      })()
    : []
  const isEmpty = series.every((s) => s.values.every((v) => v === null))
  const allValues = stacked
    ? stackedLayers.flatMap((l) => l.high)
    : series.flatMap((s) => s.values.filter((v): v is number => v !== null))
  const step = niceStep(maxValue ?? (allValues.length ? Math.max(...allValues) : 0))
  const top = step * 4
  const y = (v: number) => pad.top + plotH - (v / top) * plotH
  const yTicks = [0, step, 2 * step, 3 * step, top]
  const digits = Number.isInteger(step) ? 0 : 1

  // Étiquettes d'abscisse : celles données, ou une sur n selon la place (elles se chevauchaient sur téléphone).
  const autoEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / Math.max(64, Math.max(0, ...labels.map((l) => l.length)) * 6 + 12)))))
  const tickAt = (i: number): string | null => (ticks ? (ticks[i] ?? null) : i % autoEvery === 0 || i === n - 1 ? labels[i] : null)
  const anchor = (i: number) => (i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle')

  function linePath(points: [number, number][]): string {
    return points.map(([i, v], k) => `${k ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  }
  function areaPath(points: [number, number][]): string {
    const first = points[0][0]
    const last = points[points.length - 1][0]
    return `${linePath(points)}L${x(last).toFixed(1)},${bottom}L${x(first).toFixed(1)},${bottom}Z`
  }

  function indexAt(clientX: number): number {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const ratio = (clientX - rect.left - pad.left) / plotW
    return Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))))
  }

  const fmt = (v: number) => `${formatNumberFr(v, v < 10 ? 1 : 0)} ${unit}`
  const legendItems = [
    ...series.map((s) => ({ label: s.name, kind: stacked ? ('box' as const) : (s.kind ?? 'line'), color: s.color })),
    ...(nowIndex !== undefined ? [{ label: 'À venir', kind: 'box' as const, color: 'var(--color-bg-elevated)' }, { label: 'Maintenant', kind: 'mark' as const, color: 'var(--color-text-primary)' }] : []),
    ...legendExtra.map((e) => ({ label: e.label, kind: e.swatch, color: e.color })),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div ref={boxRef} className="relative w-full min-w-0 select-none overflow-hidden">
        <svg
          width={width}
          height={height}
          tabIndex={0}
          role="slider"
          aria-label={`${yAxisLabel} selon ${xAxisLabel.toLowerCase()} : ${series.map((s) => s.name).join(', ')}`}
          aria-valuemin={0}
          aria-valuemax={n - 1}
          aria-valuenow={active ?? 0}
          aria-valuetext={active === null ? 'aucun point choisi' : labels[active]}
          className="focus-ring"
          onMouseMove={(e) => setActive(indexAt(e.clientX))}
          onMouseLeave={() => setActive(null)}
          onClick={(e) => setActive(indexAt(e.clientX))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') setActive((a) => Math.min(n - 1, (a ?? -1) + 1))
            else if (e.key === 'ArrowLeft') setActive((a) => Math.max(0, (a ?? n) - 1))
            else if (e.key === 'Escape') setActive(null)
          }}
          onBlur={() => setActive(null)}
        >
          {bands.map((b, k) => (
            <rect key={`b${k}`} x={x(b.from)} y={pad.top} width={Math.max(1, x(b.to) - x(b.from))} height={plotH} fill={b.color} />
          ))}
          {nowIndex !== undefined && nowIndex < n && (
            <rect x={x(nowIndex)} y={pad.top} width={Math.max(0, x(n - 1) - x(nowIndex))} height={plotH} fill="var(--color-bg-elevated)" />
          )}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth={1} />
              <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" className="fill-text-tertiary font-mono text-mono-axis">
                {isEmpty ? '' : formatNumberFr(t, digits)}
              </text>
            </g>
          ))}
          {separators.map((i) => (
            <line key={`s${i}`} x1={x(i)} x2={x(i)} y1={zones.length ? 4 : pad.top} y2={bottom} stroke="var(--color-text-secondary)" strokeWidth={1} strokeDasharray="2 3" />
          ))}
          {zones.map((z) => (
            <text key={z.label} x={(x(z.from) + x(z.to)) / 2} y={18} textAnchor="middle" className="fill-text-primary text-[13px] font-semibold">
              {z.label}
            </text>
          ))}

          {stacked
            ? series.map((s, k) => {
                const { low, high } = stackedLayers[k]
                const up = high.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
                const back = low.map((_, j) => `L${x(n - 1 - j).toFixed(1)},${y(low[n - 1 - j]).toFixed(1)}`).join('')
                return (
                  <g key={s.name}>
                    <path d={`${up}${back}Z`} fill={s.color} fillOpacity={0.75} />
                    <path d={up} fill="none" stroke="var(--color-card)" strokeWidth={1} />
                  </g>
                )
              })
            : series.map((s) =>
                segments(s.values).map((seg, k) => (
                  <g key={`${s.name}${k}`}>
                    {s.kind === 'area' && seg.length > 1 && <path d={areaPath(seg)} fill={s.color} fillOpacity={0.14} />}
                    {seg.length > 1 ? (
                      <path d={linePath(seg)} fill="none" stroke={s.color} strokeWidth={s.kind === 'dashed' ? 2 : 2.25} strokeDasharray={s.kind === 'dashed' ? '6 5' : undefined} strokeLinejoin="round" />
                    ) : (
                      // Un point isolé (entouré de trous) reste visible.
                      <circle cx={x(seg[0][0])} cy={y(seg[0][1])} r={3} fill={s.color} />
                    )}
                  </g>
                )),
              )}

          {nowIndex !== undefined && nowIndex < n && (
            <g>
              <line x1={x(nowIndex)} x2={x(nowIndex)} y1={pad.top} y2={bottom} stroke="var(--color-text-primary)" strokeWidth={1.5} />
              <text x={x(nowIndex) + 6} y={pad.top + 14} className="fill-text-primary text-[12px] font-semibold">
                maintenant
              </text>
            </g>
          )}
          {/* Axes : trait à gauche et en bas, comme les barres du site. */}
          <line x1={pad.left} x2={pad.left} y1={pad.top} y2={bottom} stroke={AXIS} strokeWidth={1} />
          <line x1={pad.left} x2={width - pad.right} y1={bottom} y2={bottom} stroke={AXIS} strokeWidth={1} />
          {labels.map((_, i) => {
            const tick = tickAt(i)
            return tick === null ? null : (
              <text key={`t${i}`} x={x(i)} y={height - 8} textAnchor={anchor(i)} className="fill-text-tertiary font-mono text-mono-axis">
                {tick}
              </text>
            )
          })}
          {active !== null && <line x1={x(active)} x2={x(active)} y1={pad.top} y2={bottom} stroke="var(--color-text-secondary)" strokeDasharray="3 3" />}
        </svg>
        {isEmpty && emptyMessage && (
          <div className="pointer-events-none absolute inset-x-0 flex items-center justify-center px-6" style={{ top: pad.top, height: plotH }}>
            <p className="pointer-events-auto max-w-md border border-border bg-card px-4 py-3 text-center text-sm text-text-secondary">{emptyMessage}</p>
          </div>
        )}
        {active !== null && (
          <output
            className="pointer-events-none absolute top-0 z-10 bg-dark-bg px-2.5 py-1.5 text-xs text-white"
            style={{ left: Math.min(Math.max(0, x(active) - 70), width - 190) }}
          >
            <div className="font-semibold">{labels[active]}</div>
            {series.map((s) => (
              <div key={s.name}>
                {s.name} : {s.values[active] === null ? 'pas de valeur' : fmt(s.values[active] as number)}
              </div>
            ))}
            {stacked && <div className="font-semibold">Total : {fmt(series.reduce((sum, s) => sum + (s.values[active] ?? 0), 0))}</div>}
            {extraTip?.(active) && <div>{extraTip(active)}</div>}
          </output>
        )}
      </div>
      <div className="flex flex-wrap justify-between gap-2 font-mono text-mono-axis text-text-tertiary">
        <span>axe des ordonnées : {yAxisLabel}</span>
        <span>axe des abscisses : {xAxisLabel} · survol pour la valeur</span>
      </div>
      {showLegend && (
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary" aria-hidden="true">
          {legendItems.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <Swatch kind={item.kind} color={item.color} />
              {item.label}
            </li>
          ))}
        </ul>
      )}
      <table className="sr-only">
        <thead>
          <tr>
            <th>Point</th>
            {series.map((s) => (
              <th key={s.name}>{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={label + i}>
              <td>{label}</td>
              {series.map((s) => (
                <td key={s.name}>{s.values[i] === null ? 'pas de valeur' : fmt(s.values[i] as number)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
