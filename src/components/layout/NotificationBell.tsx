import { AlertTriangle, Bell, Box, ClipboardList, Database, FileText, Lightbulb, MessageCircleQuestion, Receipt } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useNotifications } from '@/hooks/useNotifications'
import { formatUtcDateTime } from '@/lib/formatters'
import { notificationLabel } from '@/lib/notificationLinks'
import type { BackendNotification } from '@/types/backend'
import type { Profile } from '@/types/domain'

interface NotificationBellProps {
  profile: Profile
}

const ICONS: Record<BackendNotification['kind'], typeof Bell> = {
  alerte: AlertTriangle,
  retour: MessageCircleQuestion,
  facture: FileText,
  releve: Receipt,
  plan: ClipboardList,
  boitier: Box,
  conseil: Lightbulb,
  collecte: Database,
}

/**
 * Cloche unique, dans la barre du haut (demande du propriétaire, 2026-10-18) : le compteur des notifications pas
 * encore vues, et au clic la liste de tout ce qui notifie (alertes, conseils, factures, relevés, plan, boîtiers).
 * Un clic sur une notification mène à l'élément lui-même. Plus de bandeau surgissant.
 */
export function NotificationBell({ profile }: NotificationBellProps) {
  const { enabled, items, unseenCount, isUnseen, markSeen } = useNotifications(profile)
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!enabled) return null
  const label = notificationLabel(unseenCount)

  function go(item: BackendNotification) {
    markSeen([item.id])
    setOpen(false)
    navigate(item.link)
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="focus-ring relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border text-text-primary transition-colors hover:bg-bg-elevated"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unseenCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-accent px-1 font-mono text-[0.7rem] font-semibold text-text-primary"
          >
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>

      {open && (
        <section
          id={panelId}
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 flex max-h-[min(32rem,calc(100dvh-5rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden border border-border bg-card shadow-assistant-panel"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
            {unseenCount > 0 && (
              <button
                type="button"
                onClick={() => markSeen(items.map((i) => i.id))}
                className="focus-ring text-xs font-semibold text-accent-cta hover:underline"
              >
                Tout marquer comme vu
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-text-secondary">Rien à signaler pour le moment.</p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {items.map((item) => {
                const Icon = ICONS[item.kind] ?? Bell
                const fresh = isUnseen(item.id)
                return (
                  <li key={item.id} className="border-b border-border last:border-b-0">
                    <button
                      type="button"
                      onClick={() => go(item)}
                      className={`focus-ring flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-bg-elevated ${fresh ? 'bg-bg-elevated/60' : ''}`}
                    >
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.level === 'alerte' || item.level === 'critique' ? 'text-alert' : 'text-text-secondary'}`} aria-hidden="true" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={`text-sm text-text-primary ${fresh ? 'font-semibold' : ''}`}>{item.title}</span>
                        {item.detail && <span className="line-clamp-2 text-xs text-text-secondary">{item.detail}</span>}
                        {item.at && <span className="text-xs tabular-nums text-text-tertiary">{formatUtcDateTime(item.at)}</span>}
                      </span>
                      {fresh && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="nouvelle" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
