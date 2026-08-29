import { AdminOverview } from '@/pages/app/overview/AdminOverview'
import { IndustrieOverview } from '@/pages/app/overview/IndustrieOverview'
import { MenageOverview } from '@/pages/app/overview/MenageOverview'
import { PmeOverview } from '@/pages/app/overview/PmeOverview'
import { useSessionStore } from '@/store/sessionStore'

export function OverviewPage() {
  const profile = useSessionStore((s) => s.session?.profile)

  switch (profile) {
    case 'menage':
      return <MenageOverview />
    case 'pme':
      return <PmeOverview />
    case 'industrie':
      return <IndustrieOverview />
    case 'admin':
      return <AdminOverview />
    default:
      return null
  }
}
