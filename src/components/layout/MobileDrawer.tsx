import { useEffect, useRef, type KeyboardEvent } from 'react'

import { SideRail } from '@/components/layout/SideRail'
import { onEscape } from '@/lib/a11y'
import { useUiStore } from '@/store/uiStore'

export function MobileDrawer() {
  const open = useUiStore((s) => s.mobileDrawerOpen)
  const close = useUiStore((s) => s.closeMobileDrawer)

  const panelRef = useRef<HTMLDivElement>(null)

  // Ouverture : le focus entre dans le tiroir ; fermeture : il retourne au bouton qui l'a ouvert.
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')?.focus()
    return () => trigger?.focus()
  }, [open])

  if (!open) return null

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onEscape(close)(event)
    if (event.key !== 'Tab') return
    const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    if (!items || items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <button
        type="button"
        aria-label="Fermer la navigation"
        tabIndex={-1}
        className="absolute inset-0 bg-dark-bg/40 overlay-backdrop"
        onClick={close}
      />
      <div
        ref={panelRef}
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onKeyDown={handleKeyDown}
        className="relative h-full w-[280px] max-w-[80vw] border-r border-dark-field-border bg-dark-bg shadow-assistant-panel overlay-panel-right"
      >
        <SideRail onNavigate={close} />
      </div>
    </div>
  )
}
