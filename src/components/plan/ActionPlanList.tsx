import { levelAtLeast } from '@/lib/levelGating'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useActionPlan } from '@/hooks/queries/useActionPlan'
import type { Level, Profile } from '@/types/domain'

interface ActionPlanListProps {
  profile: Profile
  level: Level
}

/** Contenu réservé au niveau "technique" (voir levelGating.ts) — un plan
 * d'action chiffré mensuel suppose déjà une lecture assidue du dashboard. */
export function ActionPlanList({ profile, level }: ActionPlanListProps) {
  const query = useActionPlan(profile)

  if (!levelAtLeast(level, 'technique')) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">Plan d&rsquo;action mensuel chiffré</h2>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col gap-3">
          {query.data?.map((item) => (
            <Card key={item.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-text-primary">{item.title}</p>
                <p className="text-sm text-text-secondary">{item.detail}</p>
              </div>
              <span className="font-mono text-lg font-semibold text-confirm">{item.amountLabel}</span>
              <ProvenanceBadge value={item.provenance} />
            </Card>
          ))}
        </div>
      </MetricState>
    </section>
  )
}
