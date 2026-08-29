import { RecommendationList } from '@/components/recommendations/RecommendationList'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function RecommendationsPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <RecommendationList profile={profile} level={level} />
    </div>
  )
}
