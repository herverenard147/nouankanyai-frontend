interface RowActionsProps {
  onEdit: () => void
  onDelete: () => void
  /** Pour les lecteurs d'écran : « Modifier Groupe froid ». */
  label: string
}

/** « Modifier · Supprimer » en fin de ligne : texte d'action (couleur accent-cta), suppression en rouge. */
export function RowActions({ onEdit, onDelete, label }: RowActionsProps) {
  return (
    <span className="inline-flex gap-4">
      <button type="button" onClick={onEdit} className="focus-ring text-sm font-semibold text-accent-cta hover:text-accent-cta-hover" aria-label={`Modifier ${label}`}>
        Modifier
      </button>
      <button type="button" onClick={onDelete} className="focus-ring text-sm font-semibold text-alert hover:underline" aria-label={`Supprimer ${label}`}>
        Supprimer
      </button>
    </span>
  )
}
