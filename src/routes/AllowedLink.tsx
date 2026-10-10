import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'

import { isRouteAllowed } from '@/lib/navConfig'
import { useSessionStore } from '@/store/sessionStore'

/**
 * Lien interne affiché seulement si le profil connecté a le droit d'ouvrir la page
 * cible (même règle que ProfileGuard). Sans ça, un lien vers une page interdite
 * renvoyait silencieusement vers /app au clic.
 */
export function AllowedLink({ to, ...props }: ComponentProps<typeof Link> & { to: string }) {
  const profile = useSessionStore((s) => s.session?.profile)
  if (!profile || !isRouteAllowed(to, profile)) return null
  return <Link to={to} {...props} />
}
