import { SideRail } from '@/components/layout/SideRail'
import { onEscape } from '@/lib/a11y'
import { useUiStore } from '@/store/uiStore'

export function MobileDrawer() {
  const open = useUiStore((s) => s.mobileDrawerOpen)
  const close = useUiStore((s) => s.closeMobileDrawer)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex lg:hidden">
      <button
        type="button"
        aria-label="Fermer la navigation"
        className="absolute inset-0 bg-dark-bg/40 overlay-backdrop"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onKeyDown={onEscape(close)}
        className="relative h-full w-[280px] max-w-[80vw] border-r border-dark-field-border bg-dark-bg shadow-assistant-panel overlay-panel-right"
      >
        <SideRail onNavigate={close} />
      </div>
    </div>
  )
}
