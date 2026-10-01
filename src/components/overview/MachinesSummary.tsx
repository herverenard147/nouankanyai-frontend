import { Link } from 'react-router-dom'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useMachinesTable } from '@/hooks/queries/useMachinesTable'
import type { IndustrieOverviewBlocks } from '@/lib/overviewLevels'
import type { MachineRow } from '@/types/domain'

interface MachinesSummaryProps {
  columns: IndustrieOverviewBlocks['machineColumns']
  /** Nombre de machines affichées ; la liste complète est sur /app/machines. */
  max?: number
}

/** Aperçu des machines suivies, les machines en anomalie d'abord. */
export function MachinesSummary({ columns, max = 5 }: MachinesSummaryProps) {
  const query = useMachinesTable('industrie')
  const rows = query.data ? sortByAnomalyFirst(query.data.rows).slice(0, max) : []
  const full = columns === 'full'

  return (
    <section aria-label="Machines suivies" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-text-primary">{query.data?.title ?? 'Machines suivies'}</h2>
        <Link to="/app/machines" className="focus-ring text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover">
          Toutes les machines →
        </Link>
      </div>
      <MetricState status={query.status} isEmpty={query.data?.rows.length === 0}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[0.8125rem]">
            <thead>
              <tr className="text-left font-mono text-mono-axis uppercase text-text-secondary">
                <th scope="col" className="py-1.5 pr-3 font-medium">Machine</th>
                <th scope="col" className="py-1.5 pr-3 font-medium">Statut</th>
                {full ? (
                  <>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Temp.</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Vibration</th>
                    <th scope="col" className="py-1.5 pr-3 font-medium">Pression</th>
                  </>
                ) : (
                  <th scope="col" className="py-1.5 pr-3 font-medium">Priorité</th>
                )}
                <th scope="col" className="py-1.5 font-medium">Provenance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const anomaly = isAnomaly(row)
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold text-text-primary">{row.machine}</td>
                    <td className={`py-2 pr-3 ${anomaly ? 'font-semibold text-alert' : 'text-text-primary'}`}>{row.statut}</td>
                    {full ? (
                      <>
                        <td className="py-2 pr-3 font-mono tabular-nums">{row.temperature}</td>
                        <td className="py-2 pr-3 font-mono tabular-nums">{row.vibration}</td>
                        <td className="py-2 pr-3 font-mono tabular-nums">{row.pression}</td>
                      </>
                    ) : (
                      <td className="py-2 pr-3">{row.priorite}</td>
                    )}
                    <td className="py-2">
                      <ProvenanceBadge value={row.provenance} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </MetricState>
    </section>
  )
}

function isAnomaly(row: MachineRow): boolean {
  return row.statut.toLowerCase().includes('anomalie')
}

function sortByAnomalyFirst(rows: MachineRow[]): MachineRow[] {
  return [...rows].sort((a, b) => Number(isAnomaly(b)) - Number(isAnomaly(a)))
}
