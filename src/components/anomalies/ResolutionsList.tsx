import { levelAtLeast } from '@/lib/levelGating'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useResolutions } from '@/hooks/queries/useAnomalies'
import type { Level, Profile } from '@/types/domain'

interface ResolutionsListProps {
  profile: Profile
  level: Level
}

/** Contenu réservé au niveau "technique" (voir levelGating.ts). */
export function ResolutionsList({ profile, level }: ResolutionsListProps) {
  const query = useResolutions(profile)

  if (!levelAtLeast(level, 'technique')) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">Historique des résolutions d&rsquo;anomalies</h2>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col gap-3">
          {query.data?.map((res) => (
            <Card key={res.id} className="flex flex-wrap items-center gap-4 p-5">
              <span className="font-mono text-sm text-text-tertiary">{res.date}</span>
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-text-primary">{res.machineLabel}</p>
                <p className="text-sm text-text-secondary">{res.resultLabel}</p>
              </div>
              <ProvenanceBadge value={res.provenance} />
            </Card>
          ))}
        </div>
      </MetricState>
    </section>
  )
}
