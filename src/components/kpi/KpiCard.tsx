import { kpiMeta } from '@/api/kpis'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useKpi } from '@/hooks/queries/useKpi'
import type { Profile } from '@/types/domain'

interface KpiCardProps {
  profile: Profile
  kpiId: string
}

export function KpiCard({ profile, kpiId }: KpiCardProps) {
  const { label, window } = kpiMeta(profile, kpiId)
  const query = useKpi(profile, kpiId)

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-text-secondary">{label}</h3>
        {window && (
          <p className="font-mono text-mono-axis text-text-tertiary">
            fenêtre {window.label}
            {window.sampleCount !== undefined ? ` · ${window.sampleCount.toLocaleString('fr-FR')} échantillons` : ''}
          </p>
        )}
      </div>

      <MetricState status={query.status}>
        {query.data && (
          <>
            <p className="font-heading text-kpi-value font-semibold tabular-nums text-text-primary">
              {query.data.value}
              {query.data.unit && <span className="ml-1 text-sm font-medium text-text-secondary">{query.data.unit}</span>}
            </p>
            <p className="text-sm text-text-secondary">{query.data.note}</p>
            <div className="mt-auto border-t border-dashed border-border pt-2.5">
              <ProvenanceBadge value={query.data.provenance} />
            </div>
          </>
        )}
      </MetricState>
    </Card>
  )
}
