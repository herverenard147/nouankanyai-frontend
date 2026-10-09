import { clsx } from 'clsx'
import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'

export interface ComboboxOption {
  value: string
  /** Texte secondaire affiché à droite de la suggestion (ex. « 1,1 kW »). */
  hint?: string
}

interface ComboboxFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Appelé quand une suggestion est choisie (clic ou Entrée), en plus de onChange. */
  onSelect?: (option: ComboboxOption) => void
  options: ComboboxOption[]
  required?: boolean
  maxSuggestions?: number
}

const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

/** Tous les mots tapés doivent se retrouver dans la suggestion, dans n'importe quel ordre ;
 * celles qui commencent par la saisie passent devant. */
export function filterOptions(options: ComboboxOption[], query: string, limit: number): ComboboxOption[] {
  const words = plain(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return options.slice(0, limit)
  const q = plain(query.trim())
  return options
    .filter((o) => {
      const text = plain(o.value)
      return words.every((w) => text.includes(w))
    })
    .sort((a, b) => Number(plain(b.value).startsWith(q)) - Number(plain(a.value).startsWith(q)))
    .slice(0, limit)
}

/**
 * Champ texte avec suggestions sous la saisie (motif « combobox » ARIA, liste filtrée à chaque
 * mot tapé). La saisie libre reste possible : une suggestion n'est qu'une aide, jamais imposée.
 * Flèches haut/bas pour parcourir, Entrée pour choisir, Échap pour fermer.
 */
export function ComboboxField({ label, value, onChange, onSelect, options, required, maxSuggestions = 8 }: ComboboxFieldProps) {
  const id = useId()
  const listId = `${id}-suggestions`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const suggestions = filterOptions(options, value, maxSuggestions)
  const visible = open && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0].value === value)

  function choose(option: ComboboxOption) {
    onChange(option.value)
    onSelect?.(option)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && visible && active >= 0) {
      event.preventDefault()
      choose(suggestions[active])
    } else if (event.key === 'Escape' && visible) {
      // Ferme seulement la liste : sans stopPropagation, le modal qui contient le champ se fermerait aussi.
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-text-primary">
        {label}
      </label>
      <input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={visible}
        aria-controls={listId}
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        required={required}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="focus-ring min-h-11 rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
      />
      {visible && (
        <ul id={listId} role="listbox" aria-label={`Suggestions : ${label}`} className="absolute top-full z-50 mt-1 max-h-64 w-full overflow-y-auto border border-border bg-card shadow-assistant-panel">
          {suggestions.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown plutôt que click : le blur de l'input fermerait la liste avant le click.
              onMouseDown={(event) => {
                event.preventDefault()
                choose(option)
              }}
              className={clsx('flex cursor-pointer items-baseline justify-between gap-3 px-3.5 py-2 text-sm text-text-primary', index === active ? 'bg-bg-elevated' : 'hover:bg-bg-elevated')}
            >
              <span>{option.value}</span>
              {option.hint && <span className="shrink-0 text-xs text-text-secondary">{option.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
