import { Pill } from '@/components/ui/Pill'
import type { Level } from '@/types/domain'

const LEVELS: { id: Level; label: string }[] = [
  { id: 'debutant', label: 'Débutant' },
  { id: 'amateur', label: 'Amateur' },
  { id: 'technique', label: 'Technique' },
]

interface LevelSelectorProps {
  value: Level
  onChange?: (level: Level) => void
  readOnly?: boolean
  className?: string
  /** Niveaux proposés (par défaut les trois) ; voir src/lib/pageLevels.ts. */
  options?: Level[]
}

/** Sélecteur de niveau : le seul sélecteur qui reste dans l'interface, modifiable à tout moment. */
export function LevelSelector({ value, onChange, readOnly, className, options }: LevelSelectorProps) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`} role="group" aria-label="Niveau d'affichage">
      {LEVELS.filter((level) => !options || options.includes(level.id)).map((level) => (
        <Pill
          key={level.id}
          active={value === level.id}
          disabled={readOnly}
          onClick={readOnly ? undefined : () => onChange?.(level.id)}
        >
          {level.label}
        </Pill>
      ))}
    </div>
  )
}
