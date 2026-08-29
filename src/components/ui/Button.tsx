import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent-cta text-white hover:bg-accent-cta-hover',
  ghost: 'bg-transparent text-text-primary border border-border hover:bg-bg-elevated',
  outline: 'bg-transparent text-text-primary border border-border hover:bg-bg-elevated',
}

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        'focus-ring inline-flex min-h-11 items-center justify-center rounded-control px-5 py-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
