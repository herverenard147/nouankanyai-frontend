import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, className, id, ...rest }: TextFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = `${fieldId}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={fieldId}
        className={clsx(
          'focus-ring min-h-11 rounded-control border bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary',
          error ? 'border-alert' : 'border-border',
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-sm text-alert">
          {error}
        </p>
      )}
    </div>
  )
}
