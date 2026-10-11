import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Action en cours (calcul, envoi) : roue d'attente, bouton inactif. */
  loading?: boolean
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent-cta text-white hover:bg-accent-cta-hover',
  ghost: 'bg-transparent text-text-primary border border-border hover:bg-bg-elevated',
  outline: 'bg-transparent text-text-primary border border-border hover:bg-bg-elevated',
}

/** Roue d'attente pour un bouton qui n'utilise pas `Button` (lien d'action, bouton sombre). */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-4 w-4 shrink-0 animate-spin', className)} aria-hidden="true" />
}

export function Button({ variant = 'primary', loading = false, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'focus-ring inline-flex min-h-11 items-center justify-center rounded-control px-5 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  )
}
