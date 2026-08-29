import { Button } from '@/components/ui/Button'

interface UploadCardProps {
  title: string
  caption: string
  onUpload: () => void
  isUploading: boolean
}

/** Encart d'envoi de facture par photo : simule la prise de photo puis l'extraction OCR. */
export function UploadCard({ title, caption, onUpload, isUploading }: UploadCardProps) {
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
      <Button type="button" onClick={onUpload} disabled={isUploading}>
        {isUploading ? 'Analyse en cours…' : 'Prendre la facture en photo'}
      </Button>
    </div>
  )
}
