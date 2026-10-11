import { ArrowRight, Check, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'

import { StartProgressBar } from '@/components/onboarding/StartProgressBar'
import { useGettingStarted } from '@/hooks/useGettingStarted'
import { useGettingStartedStore } from '@/store/gettingStartedStore'
import { useSessionStore } from '@/store/sessionStore'
import type { Profile, Session } from '@/types/domain'

const INTRO: Record<Profile, string> = {
  menage: 'Quelques étapes pour comprendre votre consommation et commencer à payer moins.',
  pme: 'Les étapes qui comptent pour suivre votre activité, repérer les dépenses évitables et agir.',
  industrie: 'Les étapes qui comptent pour suivre vos machines, mesurer vos économies et piloter vos actions.',
  admin: 'Les outils à ouvrir en premier pour faire tourner la plateforme.',
}

/** Premiers pas : ce que fait chaque action importante, pour une personne qui vient de créer son compte. */
export function GettingStartedPage() {
  const session = useSessionStore((s) => s.session)
  if (!session) return null
  return <Steps session={session} />
}

function Steps({ session }: { session: Session }) {
  const { steps, doneCount, total, next } = useGettingStarted(session)
  const markVisited = useGettingStartedStore((s) => s.markVisited)

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <p className="text-sm text-text-secondary">{INTRO[session.profile]}</p>

      <section aria-label="Avancement" className="flex flex-col gap-2">
        <p className="font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold leading-tight tracking-[-0.02em] tabular-nums text-text-primary">
          {doneCount} sur {total}
          <span className="ml-2 text-sm font-medium tracking-normal text-text-secondary">
            {next ? 'étapes faites' : 'étapes faites : vous avez fait le tour'}
          </span>
        </p>
        <StartProgressBar done={doneCount} total={total} />
      </section>

      <ol className="stagger border-b border-border border-t-2 border-t-text-primary">
        {steps.map((step) => {
          const isNext = next?.id === step.id
          return (
            <li key={step.id} className="rise-in flex gap-3 border-t border-border py-4 first:border-t-0 sm:gap-4">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                  step.done ? 'bg-confirm text-white' : 'text-text-tertiary'
                }`}
              >
                {step.done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Circle className="h-5 w-5" aria-hidden="true" />}
                <span className="sr-only">{step.done ? 'Fait' : 'À faire'}</span>
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h2 className={`text-base font-bold ${step.done ? 'text-text-secondary' : 'text-text-primary'}`}>{step.title}</h2>
                <p className="text-sm text-text-secondary">{step.what}</p>
                <Link
                  to={step.to}
                  onClick={() => markVisited(session.userId, step.id)}
                  className={`focus-ring mt-1 flex min-h-11 w-fit items-center gap-1.5 text-[0.8125rem] font-semibold ${
                    isNext ? 'bg-accent px-4 text-text-primary hover:bg-accent/90' : 'text-accent-cta hover:text-accent-cta-hover'
                  }`}
                >
                  {step.done ? 'Revoir' : step.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          )
        })}
      </ol>

      {session.profile !== 'admin' && (
        <p className="text-sm text-text-secondary">
          Une question ? L&rsquo;assistant, en bas à droite de chaque page, répond en français à partir de vos données.
        </p>
      )}
    </div>
  )
}
