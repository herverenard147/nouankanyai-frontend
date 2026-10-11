import { ArrowRight, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StartProgressBar } from '@/components/onboarding/StartProgressBar'
import { useGettingStarted } from '@/hooks/useGettingStarted'
import { useGettingStartedStore, useStartDismissed } from '@/store/gettingStartedStore'
import { useSessionStore } from '@/store/sessionStore'
import type { Session } from '@/types/domain'

/**
 * Rappel des premiers pas en tête de la vue d'ensemble : une seule ligne (la vue d'ensemble
 * tient sur un écran), qui disparaît quand tout est fait ou quand la personne la masque.
 */
export function GettingStartedStrip() {
  const session = useSessionStore((s) => s.session)
  if (!session) return null
  return <Strip session={session} />
}

function Strip({ session }: { session: Session }) {
  const dismissed = useStartDismissed(session.userId)
  const dismiss = useGettingStartedStore((s) => s.dismiss)
  const { doneCount, total, next, isLoading } = useGettingStarted(session)

  if (dismissed || isLoading || !next) return null

  return (
    <section aria-label="Premiers pas" className="rise-in flex flex-col gap-2 border-y border-border py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-text-primary">
          <span className="font-bold">Premiers pas :</span> {doneCount} sur {total} faits. Prochaine étape :{' '}
          <span className="font-semibold">{next.title}</span>
        </p>
        <span className="flex items-center gap-1">
          <Link
            to="/app/premiers-pas"
            className="focus-ring flex min-h-11 items-center gap-1.5 text-[0.8125rem] font-semibold text-accent-cta hover:text-accent-cta-hover"
          >
            Continuer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => dismiss(session.userId)}
            aria-label="Masquer le rappel des premiers pas"
            className="focus-ring flex h-11 w-11 items-center justify-center text-text-secondary hover:text-text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      </div>
      <StartProgressBar done={doneCount} total={total} />
    </section>
  )
}
