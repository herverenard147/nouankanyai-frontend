import { useState } from 'react'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import type { OcrField } from '@/types/domain'

interface OcrFieldListProps {
  fields: OcrField[]
}

/** Aperçu de l'extraction OCR, champ par champ, avec correction manuelle possible. */
export function OcrFieldList({ fields }: OcrFieldListProps) {
  // Seules les corrections saisies sont gardées en état : la valeur affichée vient des props tant qu'elle n'est pas
  // corrigée (sinon une facture modifiée ailleurs restait affichée avec son ancienne valeur).
  const [edits, setEdits] = useState<Record<string, string>>({})
  const values: Record<string, string> = Object.fromEntries(fields.map((f) => [f.key, edits[f.key] ?? f.value]))
  const [editingKey, setEditingKey] = useState<string | null>(null)

  return (
    <dl className="flex flex-col gap-3">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
          <dt className="text-sm text-text-secondary">{field.label}</dt>
          <div className="flex min-w-0 items-center gap-2">
            {editingKey === field.key ? (
              <input
                autoFocus
                value={values[field.key]}
                onChange={(e) => setEdits((v) => ({ ...v, [field.key]: e.target.value }))}
                onBlur={() => setEditingKey(null)}
                className="focus-ring w-40 max-w-full min-w-0 rounded-control border border-border bg-card px-2.5 py-1.5 text-right font-mono text-sm text-text-primary"
              />
            ) : (
              <dd className="font-mono text-sm tabular-nums text-text-primary">{values[field.key]}</dd>
            )}
            {field.editable && (
              <button
                type="button"
                onClick={() => setEditingKey(field.key)}
                className="focus-ring text-xs font-semibold text-accent-cta hover:text-accent-cta-hover"
              >
                Corriger
              </button>
            )}
            <ProvenanceBadge value={field.provenance} />
          </div>
        </div>
      ))}
    </dl>
  )
}
