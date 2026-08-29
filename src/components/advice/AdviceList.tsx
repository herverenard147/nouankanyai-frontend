import { adviceSectionTitle } from '@/api/advice'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useAdvice } from '@/hooks/queries/useAdvice'
import type { Profile } from '@/types/domain'

interface AdviceListProps {
  profile: Profile
}

export function AdviceList({ profile }: AdviceListProps) {
  const query = useAdvice(profile)
  const title = adviceSectionTitle(profile)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">{title}</h2>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col gap-3">
          {query.data?.map((advice) => (
            <Card key={advice.rank} className="flex flex-wrap items-center gap-4 p-5">
              <span className="font-mono text-lg font-semibold text-text-tertiary">{advice.rank}</span>
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-text-primary">{advice.title}</p>
                <p className="text-sm text-text-secondary">{advice.detail}</p>
              </div>
              <span className="font-mono text-lg font-semibold text-confirm">{advice.impactLabel}</span>
              <ProvenanceBadge value={advice.provenance} />
            </Card>
          ))}
        </div>
      </MetricState>
    </section>
  )
}
