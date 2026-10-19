import { useEffect, useRef, useState } from 'react'

import { SERIES_COLORS } from '@/lib/chartColors'
import { formatNumberFr } from '@/lib/formatters'

/**
 * Courbes (demande du propriétaire, 2026-10-18 : les barres montraient mal les fluctuations). Une période sans
 * donnée coupe la courbe (jamais un zéro inventé). Survol ou toucher : valeurs de la période sous le doigt.
 * Les lecteurs d'écran lisent un tableau des mêmes valeurs.
 */
export interface LineSeries {
  name: string
  values: (number | null)[]
  /** Couleur CSS ; la première série prend l'accent du site. */
  color?: string
}

interface LineChartProps {
  labels: string[]
  series: LineSeries[]
  unit: string
  height?: number
  /** Une étiquette d'abscisse sur N (graphique dense). */
  xLabelEvery?: number
}

const PAD = { top: 26, right: 16, bottom: 28, left: 52 }

/** Pas « rond » de la graduation : quatre pas couvrent le maximum (1, 2, 2,5, 5 × 10ⁿ). Les graduations tombent ainsi
 * sur 0, 5, 10, 15, 20 et jamais sur 0,8 ou 2,3. */
function niceStep(max: number): number {
  if (max <= 0) return 0.25
  const power = 10 ** Math.floor(Math.log10(max / 4))
  return ([1, 2, 2.5, 5, 10].map((m) => m * power).find((step) => step * 4 >= max) ?? 10 * power)
}

export function LineChart({ labels, series, unit, height = 220, xLabelEvery = 1 }: LineChartProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, entry.contentRect.width)))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const values = series.flatMap((s) => s.values.filter((v): v is number => v !== null))
  const step = niceStep(values.length ? Math.max(...values) : 0)
  const top = step * 4
  const plotW = width - PAD.left - PAD.right
  // Pas plus d'une date tous les 70 px : sur téléphone, elles se chevauchaient.
  const labelEvery = Math.max(xLabelEvery, Math.ceil(labels.length / Math.max(2, Math.floor(plotW / 70))))
  const plotH = height - PAD.top - PAD.bottom
  const n = Math.max(1, labels.length)
  const x = (i: number) => PAD.left + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1))
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH
  const ticks = [0, step, 2 * step, 3 * step, top]
  const digits = Number.isInteger(step) ? 0 : 1

  function path(vals: (number | null)[]): string {
    let d = ''
    let open = false
    vals.forEach((v, i) => {
      if (v === null) {
        open = false
        return
      }
      d += `${open ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
      open = true
    })
    return d
  }

  function indexAt(clientX: number): number {
    const rect = boxRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const ratio = (clientX - rect.left - PAD.left) / plotW
    return Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))))
  }

  return (
    <div ref={boxRef} className="relative w-full select-none">
      {/* Survol à la souris, toucher, ou flèches gauche/droite au clavier. */}
      <svg
        width={width}
        height={height}
        tabIndex={0}
        role="slider"
        aria-label={`Courbe en ${unit} : ${series.map((s) => s.name).join(', ')}`}
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={active ?? 0}
        aria-valuetext={active === null ? 'aucune période choisie' : labels[active]}
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
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="fill-text-secondary text-[11px]">
              {formatNumberFr(t, digits)}
            </text>
          </g>
        ))}
        <text x={PAD.left - 6} y={11} textAnchor="end" className="fill-text-secondary text-[11px]">
          {unit}
        </text>
        {labels.map((label, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text
              key={label + i}
              x={x(i)}
              y={height - 8}
              // Première et dernière date calées sur le bord : elles étaient coupées.
              textAnchor={i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle'}
              className="fill-text-secondary text-[11px]"
            >
              {i === n - 1 || i % labelEvery === 0 ? label : ''}
            </text>
          ) : null,
        )}
        {series.map((s, k) => (
          <g key={s.name}>
            <path d={path(s.values)} fill="none" stroke={s.color ?? SERIES_COLORS[k % SERIES_COLORS.length]} strokeWidth={k === 0 ? 2.5 : 1.75} strokeLinejoin="round" />
            {/* Un point isolé (entouré de trous) reste visible. */}
            {s.values.map((v, i) =>
              v !== null && (s.values[i - 1] ?? null) === null && (s.values[i + 1] ?? null) === null ? (
                <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color ?? SERIES_COLORS[k % SERIES_COLORS.length]} />
              ) : null,
            )}
          </g>
        ))}
        {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--color-text-secondary)" strokeDasharray="3 3" />}
      </svg>
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary" aria-hidden="true">
          {series.map((s, k) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4" style={{ background: s.color ?? SERIES_COLORS[k % SERIES_COLORS.length] }} />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      {active !== null && (
        <output
          className="pointer-events-none absolute top-0 z-10 bg-dark-bg px-2.5 py-1.5 text-xs text-white"
          style={{ left: Math.min(Math.max(0, x(active) - 60), width - 170) }}
        >
          <div className="font-semibold">{labels[active]}</div>
          {series.map((s) => (
            <div key={s.name}>
              {s.name} : {s.values[active] === null ? 'pas de relevé' : `${formatNumberFr(s.values[active] as number, 1)} ${unit}`}
            </div>
          ))}
        </output>
      )}
      <table className="sr-only">
        <thead>
          <tr>
            <th>Période</th>
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
                <td key={s.name}>{s.values[i] === null ? 'pas de relevé' : `${formatNumberFr(s.values[i] as number, 1)} ${unit}`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
