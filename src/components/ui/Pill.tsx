import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

/** Pastille interactive : sélecteur de niveau, sélecteur de vue, etc. */
export function Pill({ active, className, children, ...rest }: PillProps) {
  return (
    <button
      type="button"
      className={clsx(
        'focus-ring rounded-pill border px-3 py-1 font-mono text-xs font-semibold transition-colors',
        active ? 'border-text-primary bg-text-primary text-white' : 'border-border bg-transparent text-text-secondary',
        className,
      )}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  )
}
