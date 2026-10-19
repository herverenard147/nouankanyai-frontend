import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'

import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import { ServicesCutBanner } from '@/components/billing/ServicesCutBanner'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { SideRail } from '@/components/layout/SideRail'
import { TopBar } from '@/components/layout/TopBar'
import { useHashTarget } from '@/hooks/useHashTarget'
import { useSessionStore } from '@/store/sessionStore'

export function AppLayout() {
  const session = useSessionStore((s) => s.session)
  useHashTarget()
  if (!session) return null

  return (
    <div className="flex min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-cta focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 overflow-hidden border-r border-dark-field-border bg-dark-bg lg:block">
        <SideRail />
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main-content" className="flex w-full max-w-[87.5rem] flex-1 flex-col gap-5 px-4 pb-24 pt-2 sm:px-6 lg:px-8">
          {['menage', 'pme', 'industrie'].includes(session.profile) && <ServicesCutBanner />}
          <Suspense fallback={<p className="py-10 text-sm text-text-secondary">Chargement…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileDrawer />
      <AssistantWidget profile={session.profile} />
    </div>
  )
}
