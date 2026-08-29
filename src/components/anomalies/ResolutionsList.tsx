import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useResolutions } from '@/hooks/queries/useAnomalies'
import type { Profile } from '@/types/domain'

interface ResolutionsListProps {
  profile: Profile
}

export function ResolutionsList({ profile }: ResolutionsListProps) {
  const query = useResolutions(profile)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">Historique des résolutions d&rsquo;anomalies</h2>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col gap-3">
          {query.data?.map((res) => (
            <Card key={res.id} className="flex flex-wrap items-center gap-4 p-5">
              <span className="font-mono text-sm text-text-tertiary">{res.date}</span>
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-text-primary">{res.anomalyLabel}</p>
                <p className="text-sm text-text-secondary">Résolu par : {res.resolutionAction}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-text-secondary">sévérité {res.severity.toFixed(2).replace('.', ',')}</span>
              <ProvenanceBadge value={res.provenance} />
            </Card>
          ))}
        </div>
      </MetricState>
    </section>
  )
}
