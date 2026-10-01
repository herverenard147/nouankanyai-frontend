import { impactClassName } from '@/lib/severity'
import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { levelAtLeast } from '@/lib/levelGating'
import { ApiError } from '@/lib/apiClient'
import { hasPlan, useApplyRecommendation } from '@/hooks/queries/useActionPlan'
import { useRecommendations } from '@/hooks/queries/useRecommendations'
import type { Advice, Level, Profile } from '@/types/domain'

interface RecommendationListProps {
  profile: Profile
  level: Level
}

export function RecommendationList({ profile, level }: RecommendationListProps) {
  const query = useRecommendations(profile)
  // Même règle que AdviceList : le chiffrage d'impact (FCFA) est un raisonnement
  // business, masqué au niveau débutant.
  const showImpact = levelAtLeast(level, 'amateur')
  // « Marquer comme appliquée » reprend la recommandation dans le plan d'action (PME/Industrie
  // uniquement, voir hasPlan) : le Ménage n'a pas ce concept côté backend.
  const canApply = hasPlan(profile)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">Recommandations d&rsquo;optimisation</h2>
      <p className="text-sm text-text-secondary">
        Des suggestions pour réduire votre consommation, pas des problèmes à résoudre, juste de bonnes pratiques
        pour chaque équipement.
      </p>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col border-t-2 border-text-primary">
          {query.data?.map((reco) => (
            <RecommendationRow key={reco.rank} reco={reco} showImpact={showImpact} canApply={canApply} />
          ))}
        </div>
      </MetricState>
    </section>
  )
}

function RecommendationRow({ reco, showImpact, canApply }: { reco: Advice; showImpact: boolean; canApply: boolean }) {
  const applyMutation = useApplyRecommendation()
  const showApplyButton = canApply && reco.sourceRef && reco.gainFcfa

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border py-4">
      <span className="text-lg font-semibold tabular-nums text-text-tertiary">{reco.rank}</span>
      <div className="min-w-[200px] flex-1">
        <p className="font-semibold text-text-primary">{reco.title}</p>
        <p className="text-sm text-text-secondary">{reco.detail}</p>
        {applyMutation.isError && (
          <ApiErrorMessage
            message={applyMutation.error instanceof ApiError ? applyMutation.error.message : "Échec de l'enregistrement."}
            className="mt-1 text-sm text-alert"
          />
        )}
      </div>
      {showImpact && <span className={`text-lg font-semibold tabular-nums ${impactClassName(reco.impactKind, reco.impactLabel)}`}>{reco.impactLabel}</span>}
      <ProvenanceBadge value={reco.provenance} />
      {showApplyButton &&
        (applyMutation.isSuccess ? (
          <span className="shrink-0 text-sm font-semibold text-confirm">Appliquée, dans le plan d&rsquo;action</span>
        ) : (
          <button
            type="button"
            disabled={applyMutation.isPending}
            onClick={() =>
              applyMutation.mutate({
                sourceRef: reco.sourceRef as string,
                title: reco.title,
                description: reco.detail,
                gainFcfa: reco.gainFcfa as number,
              })
            }
            className="focus-ring shrink-0 text-sm font-semibold text-accent-cta hover:text-accent-cta-hover disabled:opacity-60"
          >
            {applyMutation.isPending ? 'Enregistrement…' : 'Marquer comme appliquée'}
          </button>
        ))}
    </div>
  )
}
