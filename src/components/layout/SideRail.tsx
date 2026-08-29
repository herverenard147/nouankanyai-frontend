import { NavLink } from 'react-router-dom'

import { SensorDisclaimer } from '@/components/layout/SensorDisclaimer'
import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { useSessionStore } from '@/store/sessionStore'

interface SideRailProps {
  onNavigate?: () => void
}

export function SideRail({ onNavigate }: SideRailProps) {
  const session = useSessionStore((s) => s.session)
  const logout = useSessionStore((s) => s.logout)

  if (!session) return null
  const entries = NAV_BY_PROFILE[session.profile]

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-2 px-2">
        <img src="/logo.png" alt="Nouankany" className="h-8 w-8 object-contain" />
        <span className="text-sm font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
          Nouankany
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Navigation principale">
        {entries.map((entry) => (
          <NavLink
            key={entry.path}
            to={entry.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `focus-ring flex min-h-11 items-center gap-2.5 rounded-control px-2.5 text-sm transition-colors ${
                isActive ? 'bg-bg-elevated font-semibold text-text-primary' : 'text-text-secondary hover:bg-bg-elevated'
              }`
            }
          >
            <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border border-border bg-card font-mono text-[0.65rem] font-semibold text-text-secondary">
              {entry.icon}
            </span>
            {entry.label}
          </NavLink>
        ))}
      </nav>

      <SensorDisclaimer />

      <button
        type="button"
        onClick={logout}
        className="focus-ring min-h-11 rounded-control border border-border px-2.5 text-left text-sm font-semibold text-text-secondary hover:bg-bg-elevated"
      >
        Se déconnecter
      </button>
    </div>
  )
}
