import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { STEPS_BY_PROFILE } from '@/lib/gettingStarted'
import { useGettingStartedStore } from '@/store/gettingStartedStore'
import type { Session } from '@/types/domain'

/**
 * Une étape des premiers pas sans donnée qui la prouve (alertes, plan, seuils…) est faite dès que sa page est ouverte,
 * d'où qu'on vienne : menu, notification, lien d'une autre page. Test du site (2026-10-18) : seules les ouvertures
 * depuis la page « Premiers pas » comptaient, les étapes faites ailleurs restaient à faire.
 */
export function useStepVisitOnRoute(session: Session | null): void {
  const { pathname } = useLocation()
  const markVisited = useGettingStartedStore((s) => s.markVisited)
  useEffect(() => {
    if (!session) return
    for (const step of STEPS_BY_PROFILE[session.profile] ?? []) {
      if (!step.check && step.to === pathname) markVisited(session.userId, step.id)
    }
  }, [pathname, session, markVisited])
}
