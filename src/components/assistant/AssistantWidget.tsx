import { useLocation, useNavigate } from 'react-router-dom'

import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { useBilling } from '@/hooks/queries/useBilling'
import { useUiStore } from '@/store/uiStore'
import type { Profile } from '@/types/domain'

interface AssistantWidgetProps {
  profile: Profile
}

export const ASSISTANT_PAGE = '/app/assistant'
/** En dessous de cette largeur (téléphone), l'assistant s'ouvre dans sa propre vue, en plein écran. */
const PHONE_QUERY = '(max-width: 639px)'

/** Replié par défaut en bulle ancrée bas-droite, absent des pages Admin et des formules sans assistant. */
export function AssistantWidget({ profile }: AssistantWidgetProps) {
  const assistantOpen = useUiStore((s) => s.assistantOpen)
  const toggleAssistant = useUiStore((s) => s.toggleAssistant)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const billing = useBilling()

  if (profile === 'admin' || pathname === ASSISTANT_PAGE) return null
  // Une action que la formule ne permet pas n'est pas montrée (retour du propriétaire, 2026-10-11).
  if (billing.data?.access && !billing.data.access.assistant_ia) return null

  function handleClick() {
    if (!assistantOpen && window.matchMedia?.(PHONE_QUERY).matches) {
      navigate(ASSISTANT_PAGE)
      return
    }
    toggleAssistant()
  }

  return (
    <div className="fixed bottom-3 right-4 z-30 flex flex-col items-end gap-3">
      {assistantOpen && <AssistantPanel profile={profile} onClose={toggleAssistant} />}
      <button
        type="button"
        onClick={handleClick}
        aria-expanded={assistantOpen}
        className="focus-ring flex min-h-12 items-center gap-2 rounded-pill bg-dark-bg px-4 py-3 text-sm font-semibold text-white shadow-assistant-panel transition-colors hover:bg-accent-cta"
      >
        <span className="h-[9px] w-[9px] rounded-full bg-accent" aria-hidden="true" />
        {assistantOpen ? "Masquer l'assistant" : 'Assistant Nouankany'}
      </button>
    </div>
  )
}
