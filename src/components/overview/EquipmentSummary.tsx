import { Link } from 'react-router-dom'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useEquipmentTable } from '@/hooks/queries/useEquipmentTable'
import type { PmeOverviewBlocks } from '@/lib/overviewLevels'
import type { EquipmentRow } from '@/types/domain'

/** Aperçu des équipements déclarés (PME), les équipements en anomalie d'abord. Colonnes selon le niveau. */
export function EquipmentSummary({ columns, max = 5 }: { columns: PmeOverviewBlocks['equipmentColumns']; max?: number }) {
  const query = useEquipmentTable('pme')
  const rows = query.data ? [...query.data.rows].sort((a, b) => Number(isAnomaly(b)) - Number(isAnomaly(a))).slice(0, max) : []
  const full = columns === 'full'

  return (
    <section aria-label="Équipements déclarés" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-text-primary">{query.data?.title ?? 'Équipements déclarés'}</h2>
        <Link to="/app/equipements" className="focus-ring text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover">
          Tous les équipements →
        </Link>
      </div>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse sm:min-w-[34rem] text-[0.8125rem]">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                <th scope="col" className="py-1.5 pr-3">Équipement</th>
                <th scope="col" className="hidden py-1.5 pr-3 sm:table-cell">Catégorie</th>
                {full && <th scope="col" className="hidden py-1.5 pr-3 sm:table-cell">Marque</th>}
                {full && <th scope="col" className="hidden py-1.5 pr-3 sm:table-cell">Modèle</th>}
                <th scope="col" className="py-1.5 pr-3">Site</th>
                {full && <th scope="col" className="hidden py-1.5 pr-3 sm:table-cell">Priorité</th>}
                <th scope="col" className="py-1.5 pr-3">Statut</th>
                <th scope="col" className="py-1.5">Provenance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-2 pr-3 font-semibold text-text-primary">{row.nom}</td>
                  <td className="hidden py-2 pr-3 sm:table-cell">{row.categorie}</td>
                  {full && <td className="hidden py-2 pr-3 sm:table-cell">{row.marque}</td>}
                  {full && <td className="hidden py-2 pr-3 sm:table-cell">{row.modele}</td>}
                  <td className="py-2 pr-3">{row.site}</td>
                  {full && <td className="hidden py-2 pr-3 sm:table-cell">{row.priorite}</td>}
                  <td className={`py-2 pr-3 ${isAnomaly(row) ? 'font-semibold text-alert' : ''}`}>{row.statut}</td>
                  <td className="py-2">
                    <ProvenanceBadge value={row.provenance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MetricState>
    </section>
  )
}

function isAnomaly(row: EquipmentRow): boolean {
  return row.statut.toLowerCase().includes('anomalie')
}
