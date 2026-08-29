import { Outlet } from 'react-router-dom'

import { AssistantWidget } from '@/components/assistant/AssistantWidget'
import { MobileDrawer } from '@/components/layout/MobileDrawer'
import { SideRail } from '@/components/layout/SideRail'
import { TopBar } from '@/components/layout/TopBar'
import { useSessionStore } from '@/store/sessionStore'

export function AppLayout() {
  const session = useSessionStore((s) => s.session)
  if (!session) return null

  return (
    <div className="mx-auto flex min-h-screen max-w-[1440px] bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-accent-cta focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu
      </a>
      <aside className="hidden w-[244px] shrink-0 border-r border-border lg:block">
        <SideRail />
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main-content" className="flex flex-1 flex-col gap-7 px-7 pb-32 pt-7">
          <Outlet />
        </main>
      </div>
      <MobileDrawer />
      <AssistantWidget profile={session.profile} />
    </div>
  )
}
