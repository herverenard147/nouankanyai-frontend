import { Navigate, useNavigate } from 'react-router-dom'

import { AssistantPanel } from '@/components/assistant/AssistantPanel'
import { useBilling } from '@/hooks/queries/useBilling'
import { useSessionStore } from '@/store/sessionStore'

/** L'assistant dans sa propre vue, en plein écran : c'est ainsi qu'il s'ouvre sur un téléphone. */
export function AssistantPage() {
  const session = useSessionStore((s) => s.session)
  const navigate = useNavigate()
  const billing = useBilling()
  if (!session) return null
  if (session.profile === 'admin' || (billing.data?.access && !billing.data.access.assistant_ia)) return <Navigate to="/app/apercu" replace />

  return (
    <div className="flex h-[calc(100dvh-11rem)] min-h-[320px] max-w-3xl flex-col">
      <AssistantPanel profile={session.profile} onClose={() => navigate(-1)} fullPage />
    </div>
  )
}
