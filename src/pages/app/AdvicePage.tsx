import { AdviceList } from '@/components/advice/AdviceList'
import { useLevel } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'

export function AdvicePage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const level = useLevel(profile ?? 'menage')
  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <AdviceList profile={profile} level={level} />
    </div>
  )
}
