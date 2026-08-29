import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { useUiStore } from '@/store/uiStore'
import type { Profile } from '@/types/domain'

interface AssistantWidgetProps {
  profile: Profile
}

/** Replié par défaut en bulle ancrée bas-droite, absent des pages Admin. */
export function AssistantWidget({ profile }: AssistantWidgetProps) {
  const assistantOpen = useUiStore((s) => s.assistantOpen)
  const toggleAssistant = useUiStore((s) => s.toggleAssistant)

  if (profile === 'admin') return null

  return (
    <div className="fixed bottom-7 right-7 z-30 flex flex-col items-end gap-3">
      {assistantOpen && <AssistantPanel profile={profile} onClose={toggleAssistant} />}
      <button
        type="button"
        onClick={toggleAssistant}
        aria-expanded={assistantOpen}
        className="focus-ring flex min-h-12 items-center gap-2 rounded-pill bg-dark-bg px-4 py-3 text-sm font-semibold text-white shadow-assistant-panel transition-colors hover:bg-accent-cta"
      >
        <span className="h-[9px] w-[9px] rounded-full bg-accent" aria-hidden="true" />
        {assistantOpen ? "Masquer l'assistant" : 'Assistant Nouankany'}
      </button>
    </div>
  )
}
