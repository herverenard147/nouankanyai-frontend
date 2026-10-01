import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { adviceSectionTitle } from '@/api/advice'
import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { levelAtLeast } from '@/lib/levelGating'
import { formatNumberFr } from '@/lib/formatters'
import { impactClassName } from '@/lib/severity'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { useAdvice } from '@/hooks/queries/useAdvice'
import { useResolveMachine } from '@/hooks/queries/useMachineCrud'
import { ApiError } from '@/lib/apiClient'
import { useNotificationStore } from '@/store/notificationStore'
import type { Advice, Level, Profile } from '@/types/domain'

interface AdviceListProps {
  profile: Profile
  level: Level
  /** true uniquement sur la page dédiée /app/conseils (jamais sur l'aperçu
   * des pages Vue d'ensemble, qui réutilisent aussi ce composant) : visiter
   * cette page marque tous les conseils actuels comme vus, ce qui remet le
   * badge de la sidebar à 0 (voir useNotificationBadges). */
  markSeenOnView?: boolean
  /** Limite le nombre de conseils affichés, avec un lien "Voir plus" vers
   * /app/conseils au-delà — utilisé sur les pages Vue d'ensemble, même
   * traitement que AlertSection.maxActionAlerts. Sans cette prop (page
   * /app/conseils elle-même), la liste complète s'affiche. */
  maxItems?: number
}

function AdviceCard({ advice, showImpact }: { advice: Advice; showImpact: boolean }) {
  const resolveMutation = useResolveMachine()
  // Le diagnostic réutilise la même vérification que "Vérifier et résoudre" sur
  // /app/alertes (POST /api/machines/{id}/test) : seuls les conseils de type alerte
  // (anomalie/surchauffe/vibration) ont un machineId ET des étapes de dépannage —
  // les conseils d'optimisation/efficacité n'ont rien à "diagnostiquer".
  const canDiagnose = Boolean(advice.machineId) && Boolean(advice.troubleshooting?.length)

  return (
    <article className="flex flex-col gap-3 border-b border-border py-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-lg font-semibold tabular-nums text-text-tertiary">{advice.rank}</span>
        <div className="min-w-[200px] flex-1">
          <p className="font-semibold text-text-primary">{advice.title}</p>
          <p className="text-sm text-text-secondary">{advice.detail}</p>
        </div>
        {showImpact && <span className={`text-lg font-semibold tabular-nums ${impactClassName(advice.impactKind, advice.impactLabel)}`}>{advice.impactLabel}</span>}
        <ProvenanceBadge value={advice.provenance} />
      </div>

      {advice.troubleshooting && advice.troubleshooting.length > 0 && (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm text-text-secondary">
          {advice.troubleshooting.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      )}

      {canDiagnose && (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
          <button
            type="button"
            disabled={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate(advice.machineId as string)}
            className="focus-ring inline-flex min-h-9 w-fit items-center justify-center rounded-control bg-accent-cta px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-cta-hover disabled:opacity-60"
          >
            {resolveMutation.isPending ? 'Diagnostic en cours…' : 'Lancer le diagnostic'}
          </button>
        </div>
      )}
      {resolveMutation.isError && (
        <ApiErrorMessage
          message={resolveMutation.error instanceof ApiError ? resolveMutation.error.message : 'Échec du diagnostic.'}
          className="text-right text-sm text-alert"
        />
      )}
      {resolveMutation.isSuccess && resolveMutation.data && (
        <p className={`text-right text-sm ${resolveMutation.data.resolved ? 'text-confirm' : 'text-alert'}`}>
          {resolveMutation.data.resolved
            ? `Nouvelle mesure : température ${formatNumberFr(resolveMutation.data.temperature_c, 1)} °C, vibration ${formatNumberFr(resolveMutation.data.vibration_hz, 1)} Hz — dans les seuils normaux.`
            : `Nouvelle mesure : température ${formatNumberFr(resolveMutation.data.temperature_c, 1)} °C, vibration ${formatNumberFr(resolveMutation.data.vibration_hz, 1)} Hz — l’anomalie persiste. Suivez les étapes ci-dessus, puis réessayez.`}
        </p>
      )}
    </article>
  )
}

export function AdviceList({ profile, level, markSeenOnView, maxItems }: AdviceListProps) {
  const query = useAdvice(profile)
  const markAdviceSeen = useNotificationStore((s) => s.markAdviceSeen)
  const title = adviceSectionTitle(profile)
  // Le chiffrage d'impact (FCFA) est un raisonnement business, pas un
  // "conseil direct" — masqué au niveau débutant (voir levelGating.ts).
  const showImpact = levelAtLeast(level, 'amateur')

  useEffect(() => {
    if (markSeenOnView && query.status === 'success') {
      markAdviceSeen(query.data.map((advice) => `${advice.rank}-${advice.title}`))
    }
  }, [markSeenOnView, query.status, query.data, markAdviceSeen])

  const visibleAdvice = maxItems !== undefined ? query.data?.slice(0, maxItems) : query.data
  const hiddenCount = (query.data?.length ?? 0) - (visibleAdvice?.length ?? 0)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-section-title font-semibold text-text-primary">{title}</h2>
      <MetricState status={query.status} isEmpty={query.data?.length === 0}>
        <div className="flex flex-col border-t-2 border-text-primary">
          {visibleAdvice?.map((advice) => (
            <AdviceCard key={advice.rank} advice={advice} showImpact={showImpact} />
          ))}
        </div>
      </MetricState>
      {hiddenCount > 0 && (
        <Link
          to="/app/conseils"
          className="focus-ring self-end text-sm font-semibold text-accent-cta hover:text-accent-cta-hover"
        >
          Voir plus ({hiddenCount}) →
        </Link>
      )}
    </section>
  )
}
