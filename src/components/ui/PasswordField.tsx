import { clsx } from 'clsx'
import { useId, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { RequiredMark } from '@/components/ui/TextField'

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export function PasswordField({ label, error, className, id, ...rest }: PasswordFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1">
        <label htmlFor={fieldId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        {rest.required && <RequiredMark />}
      </div>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={clsx(
            'focus-ring min-h-11 w-full rounded-control border bg-card px-3.5 py-3 pr-16 text-sm text-text-primary placeholder:text-text-tertiary',
            error ? 'border-alert' : 'border-border',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="focus-ring absolute inset-y-0 right-3 text-xs font-semibold text-text-secondary hover:text-text-primary"
          aria-pressed={visible}
        >
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  )
}
