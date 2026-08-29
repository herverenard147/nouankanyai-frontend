interface PhotoPlaceholderProps {
  caption: string
  className?: string
  aspect?: '4/3' | 'square'
}

/**
 * Emplacement photo à sourcer, tel que défini dans le handoff : trame rayée,
 * bordure pointillée, légende de ce qu'il faut y déposer. Aucune image stock.
 */
export function PhotoPlaceholder({ caption, className, aspect = '4/3' }: PhotoPlaceholderProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-card border-[1.5px] border-dashed border-placeholder-border p-6 text-center ${
        aspect === '4/3' ? 'aspect-[4/3]' : 'aspect-square'
      } ${className ?? ''}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, var(--color-placeholder-1), var(--color-placeholder-1) 10px, var(--color-placeholder-2) 10px, var(--color-placeholder-2) 20px)',
      }}
      role="img"
      aria-label={`Photo à sourcer : ${caption}`}
    >
      <p className="font-mono text-xs text-placeholder-text">
        <span className="mb-1 block font-semibold uppercase tracking-wide">Photo à sourcer</span>
        {caption}
      </p>
    </div>
  )
}
