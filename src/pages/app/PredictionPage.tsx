import { PredictionPanel } from '@/components/prediction/PredictionPanel'
import { useSessionStore } from '@/store/sessionStore'

export function PredictionPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <PredictionPanel profile={profile} />
    </div>
  )
}
