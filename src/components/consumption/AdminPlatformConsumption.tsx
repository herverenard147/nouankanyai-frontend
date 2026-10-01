import { useState } from 'react'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Modal } from '@/components/ui/Modal'
import { useAdminPlatformConsumption, useUserMachines } from '@/hooks/queries/useAdminUsers'
import { formatNumberFr } from '@/lib/formatters'

/**
 * Vue Admin de la page Conso & coûts : même raisonnement que AdminPlatformPrediction — l'Admin
 * n'a pas d'équipement en propre, donc pas de courbe de consommation pour son propre compte.
 * Répartition de la puissance active actuelle par compte, détail par équipement dans une
 * modale (chargé à la demande, seulement à l'ouverture).
 */
export function AdminPlatformConsumption() {
  const query = useAdminPlatformConsumption()
  const [openOwnerId, setOpenOwnerId] = useState<string | null>(null)
  const rows = query.data?.rows ?? []
  const open = rows.find((r) => r.ownerId === openOwnerId) ?? null
  const machinesQuery = useUserMachines(openOwnerId)

  return (
    <div className="flex flex-col gap-4 border-t-2 border-text-primary pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-section-title font-semibold text-text-primary">Puissance active par compte</h2>
        <ProvenanceBadge value="synthetique" />
      </div>
      <MetricState status={query.status} isEmpty={rows.length === 0}>
        <div className="flex flex-col">
          {rows.map((row) => (
            <button
              key={row.ownerId}
              type="button"
              onClick={() => setOpenOwnerId(row.ownerId)}
              className="focus-ring flex items-center gap-3 border-t border-border py-3 text-left transition-colors hover:bg-bg-elevated"
            >
              <span className="min-w-0 w-40 shrink-0 truncate text-sm font-semibold text-text-primary">{row.ownerNom}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
                <div className="h-full rounded-full bg-accent-cta" style={{ width: `${row.percent}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-text-secondary">{row.percent}%</span>
              <span className="w-24 shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-text-primary">
                {formatNumberFr(row.powerKw, 1)} kW
              </span>
            </button>
          ))}
        </div>
      </MetricState>

      {open && (
        <Modal
          title={`Conso & coûts · ${open.ownerNom}`}
          description={`Puissance active actuelle, par équipement (${open.machinesCount} au total).`}
          onClose={() => setOpenOwnerId(null)}
          actions={null}
        >
          <MetricState status={machinesQuery.status} isEmpty={machinesQuery.data?.length === 0}>
            <div className="flex flex-col">
              {machinesQuery.data?.map((m) => (
                <div key={m.machine_id} className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate text-text-primary">{m.nom}</span>
                  <span className="shrink-0 font-mono tabular-nums text-text-secondary">{formatNumberFr(m.puissance_nominale_kw, 1)} kW</span>
                </div>
              ))}
            </div>
          </MetricState>
        </Modal>
      )}
    </div>
  )
}
