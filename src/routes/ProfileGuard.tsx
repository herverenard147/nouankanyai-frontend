import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { isRouteAllowed } from '@/lib/navConfig'
import { useSessionStore } from '@/store/sessionStore'

/** Une route interdite pour le profil connecté renvoie vers /app, jamais un écran d'erreur brut. */
export function ProfileGuard() {
  const session = useSessionStore((s) => s.session)
  const location = useLocation()

  if (!session) return null
  if (!isRouteAllowed(location.pathname, session.profile)) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
