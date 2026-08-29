import { Navigate } from 'react-router-dom'

import { firstRouteFor } from '@/lib/navConfig'
import { useSessionStore } from '@/store/sessionStore'

export function AppIndexRedirect() {
  const session = useSessionStore((s) => s.session)
  if (!session) return null
  return <Navigate to={firstRouteFor(session.profile)} replace />
}
