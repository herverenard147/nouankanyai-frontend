import { LOCKED, LockedFeature } from '@/components/billing/LockedFeature'
import { useAccess } from '@/hooks/queries/useBilling'
import { AdviceList } from '@/components/advice/AdviceList'
import { RecommendationList } from '@/components/recommendations/RecommendationList'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function AdvicePage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  const access = useAccess()
  if (!profile) return null
  // Conseils et détection d'anomalies : formule Optimum pour le ménage (2026-10-21).
  if (access.loaded && !access.anomalies) {
    return (
      <div className="flex flex-col gap-7">
        <LockedFeature {...LOCKED.anomalies} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-7">
      <AdviceList profile={profile} level={level} markSeenOnView />
      {/* Ménage : conseils et recommandations sur une seule page (menu resserré, partie H2). */}
      {profile === 'menage' && <RecommendationList profile={profile} level={level} />}
    </div>
  )
}
