import { AdviceList } from '@/components/advice/AdviceList'
import { useSessionStore } from '@/store/sessionStore'

export function AdvicePage() {
  const profile = useSessionStore((s) => s.session?.profile)
  if (!profile) return null

  return (
    <div className="flex flex-col gap-7">
      <AdviceList profile={profile} />
    </div>
  )
}
