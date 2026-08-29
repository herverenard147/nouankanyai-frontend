import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { levelAtLeast } from '@/lib/levelGating'
import { useRecommendations } from '@/hooks/queries/useRecommendations'
import type { Level, Profile } from '@/types/domain'

interface RecommendationListProps {
  profile: Profile
  level: Level
}

export function RecommendationList({ profile, level }: RecommendationListProps) {
  const query = useRecommendations(profile)
  // Même règle que AdviceList : le chiffrage d'impact (FCFA) est un raisonnement
  // business, masqué au niveau débutant.
  const showImpact = levelAtLeast(level, 'amateur')

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">Recommandations d&rsquo;optimisation</h2>
      <p className="text-sm text-text-secondary">
        Des suggestions pour réduire votre consommation — pas des problèmes à résoudre, juste de bonnes pratiques
        pour chaque équipement.
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col gap-3">
          {query.data?.map((reco) => (
            <Card key={reco.rank} className="flex flex-wrap items-center gap-4 p-5">
              <span className="font-mono text-lg font-semibold text-text-tertiary">{reco.rank}</span>
              <div className="min-w-[200px] flex-1">
                <p className="font-semibold text-text-primary">{reco.title}</p>
                <p className="text-sm text-text-secondary">{reco.detail}</p>
              </div>
              {showImpact && <span className="font-mono text-lg font-semibold text-confirm">{reco.impactLabel}</span>}
              <ProvenanceBadge value={reco.provenance} />
            </Card>
          ))}
        </div>
      </MetricState>
    </section>
  )
}
