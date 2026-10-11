import { AdviceList } from '@/components/advice/AdviceList'
import { RecommendationList } from '@/components/recommendations/RecommendationList'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function AdvicePage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <AdviceList profile={profile} level={level} markSeenOnView />
      {/* Ménage : conseils et recommandations sur une seule page (menu resserré, partie H2). */}
      {profile === 'menage' && <RecommendationList profile={profile} level={level} />}
    </div>
  )
}
