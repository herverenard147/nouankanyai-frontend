import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function PredictionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <PredictionPanel profile={profile} level={level} />
    </div>
  )
}
