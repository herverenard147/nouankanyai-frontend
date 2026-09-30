import { Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { LevelSelector } from '@/components/level/LevelSelector'
import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { useLevel, useLevelStore } from '@/store/levelStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUiStore } from '@/store/uiStore'

export function TopBar() {
  const session = useSessionStore((s) => s.session)
  const location = useLocation()
  const level = useLevel(session?.profile ?? 'menage')
  const setLevel = useLevelStore((s) => s.setLevel)
  const toggleMobileDrawer = useUiStore((s) => s.toggleMobileDrawer)

  if (!session) return null

  const entries = NAV_BY_PROFILE[session.profile]
  const currentEntry = entries.find((e) => location.pathname === e.path || location.pathname.startsWith(`${e.path}/`))
  // Niveau d'affichage réservé aux profils PME/Industrie (et Admin) — un
  // ménage n'a qu'une seule densité d'info, pas de raison de lui proposer ce
  // choix. Sur mobile/tablette, le choix reste accessible uniquement depuis
  // /app/parametres (pas ici, pour ne pas surcharger l'en-tête) — voir
  // SettingsPage.
  const showLevelSelector = session.profile !== 'menage'

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-7 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobileDrawer}
          className="focus-ring rounded-control border border-border p-2 lg:hidden"
          aria-label="Ouvrir la navigation"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="text-view-title font-semibold text-text-primary">{currentEntry?.label ?? 'Nouankany'}</h1>
          <p className="text-sm text-text-secondary">
            {session.displayName} · {session.subtitle}
          </p>
        </div>
      </div>
      {showLevelSelector && (
        <div className="hidden items-center gap-2 lg:flex">
          <span className="font-mono text-mono-axis uppercase tracking-wide text-text-tertiary">Niveau</span>
          <LevelSelector value={level} onChange={(l) => setLevel(session.profile, l)} />
        </div>
      )}
    </header>
  )
}
