import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAlertsBadgeCount } from '@/hooks/useNotificationBadges'
import { isRouteAllowed } from '@/lib/navConfig'
import type { Profile } from '@/types/domain'

interface NotificationBellProps {
  profile: Profile
  /** « clair » : barre du haut ; « sombre » : en-tête du menu. */
  tone?: 'clair' | 'sombre'
  onNavigate?: () => void
}

/** Libellé lu par les lecteurs d'écran et affiché au survol. */
export function notificationLabel(count: number): string {
  if (count <= 0) return 'Notifications : aucune nouvelle alerte'
  return count === 1 ? 'Notifications : 1 nouvelle alerte' : `Notifications : ${count} nouvelles alertes`
}

/**
 * Cloche des notifications (demande du propriétaire, 2026-10-18), dans la barre du haut et en tête du menu : elle mène
 * à la page des alertes et porte le même compteur que l'entrée du menu (alertes à traiter pas encore vues). Absente
 * pour un profil sans page d'alertes (technicien).
 */
export function NotificationBell({ profile, tone = 'clair', onNavigate }: NotificationBellProps) {
  const count = useAlertsBadgeCount(profile)
  if (!isRouteAllowed('/app/alertes', profile)) return null
  const label = notificationLabel(count)
  const couleurs =
    tone === 'sombre'
      ? 'border-dark-field-border text-dark-text hover:text-white'
      : 'border-border text-text-primary hover:bg-bg-elevated'

  return (
    <Link
      to="/app/alertes"
      onClick={onNavigate}
      aria-label={label}
      title={label}
      className={`focus-ring relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border transition-colors ${couleurs}`}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-accent px-1 font-mono text-[0.7rem] font-semibold text-text-primary"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
