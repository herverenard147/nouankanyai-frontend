import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useSessionStore } from '@/store/sessionStore'

export function ProtectedRoute() {
  const session = useSessionStore((s) => s.session)
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
