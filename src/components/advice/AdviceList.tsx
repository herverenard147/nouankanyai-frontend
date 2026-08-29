import { useEffect } from 'react'

import { adviceSectionTitle } from '@/api/advice'
import { levelAtLeast } from '@/lib/levelGating'
import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { MetricState } from '@/components/state/MetricState'
import { Card } from '@/components/ui/Card'
import { useAdvice } from '@/hooks/queries/useAdvice'
import { useNotificationStore } from '@/store/notificationStore'
import type { Level, Profile } from '@/types/domain'

interface AdviceListProps {
  profile: Profile
  level: Level
  /** true uniquement sur la page dédiée /app/conseils (jamais sur l'aperçu
   * des pages Vue d'ensemble, qui réutilisent aussi ce composant) : visiter
   * cette page marque tous les conseils actuels comme vus, ce qui remet le
   * badge de la sidebar à 0 (voir useNotificationBadges). */
  markSeenOnView?: boolean
}

export function AdviceList({ profile, level, markSeenOnView }: AdviceListProps) {
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
              {showImpact && <span className="font-mono text-lg font-semibold text-confirm">{advice.impactLabel}</span>}
              <ProvenanceBadge value={advice.provenance} />
            </Card>
          ))}
        </div>
      </MetricState>
    </section>
  )
}
