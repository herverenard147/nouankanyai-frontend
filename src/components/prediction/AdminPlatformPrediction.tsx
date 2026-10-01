import { useState } from 'react'

import { MetricState } from '@/components/state/MetricState'
import { Modal } from '@/components/ui/Modal'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { useAdminPlatformPredictions } from '@/hooks/queries/useAdminUsers'
import { formatNumberFr } from '@/lib/formatters'

/**
 * Vue Admin de la page Prédiction : l'Admin n'a pas d'équipement en propre (voir
 * fetchPredictionsBundle), donc pas de courbe à afficher pour son propre compte — à la place,
 * un compte = une ligne, triée par puissance prévue, avec le détail par équipement dans une
 * modale (DESIGN.md §8 : modale pour afficher un détail sans surcharger la page), pas une
 * nouvelle page.
 */
export function AdminPlatformPrediction() {
  const query = useAdminPlatformPredictions()
  const [openOwnerId, setOpenOwnerId] = useState<string | null>(null)
  const rows = [...(query.data ?? [])].sort((a, b) => (b.totalNextHourKw ?? 0) - (a.totalNextHourKw ?? 0))
  const open = rows.find((r) => r.ownerId === openOwnerId) ?? null

  return (
    <div className="flex flex-col gap-4 border-t-2 border-text-primary pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-section-title font-semibold text-text-primary">Prédiction par compte (heure suivante)</h2>
        <ProvenanceBadge value="synthetique" />
      </div>
      <MetricState status={query.status} isEmpty={rows.length === 0}>
        <div className="flex flex-col">
          {rows.map((row) => (
            <button
              key={row.ownerId}
              type="button"
              onClick={() => setOpenOwnerId(row.ownerId)}
              className="focus-ring flex items-center justify-between gap-3 border-t border-border py-3 text-left transition-colors hover:bg-bg-elevated"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{row.ownerNom}</span>
              <span className="shrink-0 text-xs text-text-secondary">{row.machines.length} équipement{row.machines.length > 1 ? 's' : ''}</span>
              <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-text-primary">
                {row.totalNextHourKw !== null ? `${formatNumberFr(row.totalNextHourKw, 1)} kW` : '—'}
              </span>
            </button>
          ))}
        </div>
      </MetricState>

      {open && (
        <Modal
          title={`Prédiction · ${open.ownerNom}`}
          description="Puissance attendue à l'heure suivante, par équipement."
          onClose={() => setOpenOwnerId(null)}
          actions={null}
        >
          <div className="flex flex-col">
            {open.machines.map((m) => (
              <div key={m.machineId} className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-sm">
                <span className="min-w-0 flex-1 truncate text-text-primary">{m.nom}</span>
                <span className="shrink-0 font-mono tabular-nums text-text-secondary">{m.nextHourValue ?? m.error ?? '—'}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
