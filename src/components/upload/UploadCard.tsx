import { useRef } from 'react'
import type { ChangeEvent } from 'react'

import { Button } from '@/components/ui/Button'

interface UploadCardProps {
  title: string
  caption: string
  onFileSelected: (file: File) => void
  isUploading: boolean
}

/** Encart d'envoi de facture par photo : ouvre le sélecteur de fichier/appareil
 * photo réel de l'appareil, puis transmet le fichier choisi à l'appelant. */
export function UploadCard({ title, caption, onFileSelected, isUploading }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFileSelected(file)
    event.target.value = ''
  }

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-card border-[1.5px] border-dashed border-placeholder-border p-6 text-center"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, var(--color-placeholder-1), var(--color-placeholder-1) 10px, var(--color-placeholder-2) 10px, var(--color-placeholder-2) 20px)',
      }}
    >
      <p className="font-semibold text-text-primary">{title}</p>
      <p className="max-w-sm text-sm text-placeholder-text">{caption}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
        {isUploading ? 'Analyse en cours…' : 'Prendre la facture en photo'}
      </Button>
    </div>
  )
}
