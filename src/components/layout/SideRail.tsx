import { LogOut } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { SensorDisclaimer } from '@/components/layout/SensorDisclaimer'
import { useAlertsBadgeCount, useAdviceBadgeCount } from '@/hooks/useNotificationBadges'
import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { NAV_ICONS } from '@/lib/navIcons'
import { useSessionStore } from '@/store/sessionStore'

interface SideRailProps {
  onNavigate?: () => void
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center bg-accent px-1.5 font-mono text-[0.7rem] font-semibold text-text-primary">
      {count > 99 ? '99+' : count}
    </span>
  )
}

/**
 * Barre latérale statique (le conteneur est collé à l'écran : sticky h-screen dans AppLayout, tiroir
 * plein hauteur sur mobile) : fond sombre, navigation avec icônes, rappel capteurs et déconnexion
 * toujours visibles sans défiler la page.
 */
export function SideRail({ onNavigate }: SideRailProps) {
  const session = useSessionStore((s) => s.session)
  const logout = useSessionStore((s) => s.logout)
  const alertsBadge = useAlertsBadgeCount(session?.profile ?? 'menage')
  const adviceBadge = useAdviceBadgeCount(session?.profile ?? 'menage')

  if (!session) return null
  const entries = NAV_BY_PROFILE[session.profile]

  return (
    <div className="flex h-full flex-col gap-4 bg-dark-bg px-2.5 py-4 text-dark-text">
      <Link to="/app/apercu" onClick={onNavigate} className="focus-ring flex items-center gap-2.5 px-3.5 pb-2 pt-1">
        <img src="/logo.png" alt="Nouankany" className="h-7 w-7 object-contain" />
        <span className="text-base font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
          Nouankany
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Navigation principale">
        {entries.map((entry) => {
          const Icon = NAV_ICONS[entry.path]
          return (
            <NavLink
              key={entry.path}
              to={entry.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `focus-ring flex min-h-11 items-center gap-3 px-3.5 text-sm transition-colors ${
                  isActive ? 'bg-dark-field font-semibold text-white' : 'text-dark-text hover:bg-dark-field/60'
                }`
              }
            >
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />}
              {entry.label}
              {entry.path === '/app/alertes' && <NavBadge count={alertsBadge} />}
              {entry.path === '/app/conseils' && <NavBadge count={adviceBadge} />}
            </NavLink>
          )
        })}
      </nav>

      <SensorDisclaimer />

      <button
        type="button"
        onClick={logout}
        className="focus-ring flex min-h-11 items-center gap-3 border-t border-dark-field-border px-3.5 text-left text-sm font-semibold text-dark-text hover:bg-dark-field/60"
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        Se déconnecter
      </button>
    </div>
  )
}
