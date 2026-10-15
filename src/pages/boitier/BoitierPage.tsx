import { Suspense, lazy, useCallback, useState } from 'react'

import { Boitier2D } from '@/components/boitier/Boitier2D'
import { BOITIER_PHRASES, BOITIER_STATES, boitierState } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'
import { Footer } from '@/pages/landing/sections/Footer'
import { NavBar } from '@/pages/landing/sections/NavBar'

// Vue éclatée (bibliothèque 3D et modèle chargés à la demande, seulement sur cette page).
const BoitierEclate = lazy(() => import('@/components/boitier/BoitierEclate'))

export function BoitierPage() {
  const [state, setState] = useState<BoitierState>('rouge')
  const info = boitierState(state)
  const [no3d, setNo3d] = useState(false)
  const onUnavailable = useCallback(() => setNo3d(true), [])

  return (
    <>
      <NavBar />
      <main id="main-content">
        <section className="bg-dark-bg py-16 text-white lg:py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <h1 className="max-w-[20ch] text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.025em]">
              Votre installation, résumée par une lumière et une voix.
            </h1>
            <p className="mt-5 max-w-[58ch] text-[1.2rem] leading-snug text-dark-text">
              Le boîtier Nouankany montre en permanence l&rsquo;état de vos appareils, vous dit quoi faire quand
              l&rsquo;un d&rsquo;eux dérive, et l&rsquo;éteint quand vous le lui demandez.
            </p>

            <div className="mt-14 grid items-start gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-[72px]">
              <div className="bg-dark-field px-4 py-10 sm:px-8">
                {no3d ? (
                  <Boitier2D state={state} />
                ) : (
                  <Suspense fallback={<Boitier2D state={state} />}>
                    <BoitierEclate state={state} onUnavailable={onUnavailable} />
                  </Suspense>
                )}
                <p className="mt-6 text-center text-sm text-dark-text">
                  Vue 3D du prototype : glissez pour le faire tourner dans tous les sens, molette pour zoomer. « Éclaté »
                  sépare les pièces ; cliquez sur l&rsquo;une d&rsquo;elles pour la détailler. Choisissez un état à droite :
                  l&rsquo;anneau prend sa couleur.
                </p>
              </div>

              <div>
                <div
                  role="group"
                  aria-label="État affiché par le boîtier"
                  className="grid grid-cols-2 border border-dark-field-border"
                >
                  {BOITIER_STATES.map((item, index) => {
                    const selected = item.id === state
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setState(item.id)}
                        className={`focus-ring flex min-h-12 items-center gap-3 px-4 py-2 text-left text-[0.95rem] font-semibold ${
                          index % 2 === 1 ? 'border-l border-dark-field-border' : ''
                        } ${index > 1 ? 'border-t border-dark-field-border' : ''} ${
                          selected ? 'bg-white text-text-primary' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span
                          className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/30"
                          style={{ backgroundColor: item.led }}
                          aria-hidden="true"
                        />
                        {item.label}
                      </button>
                    )
                  })}
                </div>

                <div aria-live="polite" className="mt-7">
                  <p className="text-[1.15rem] font-semibold">{info.meaning}</p>
                  <ol className="mt-6 border-t border-dark-field-border">
                    {info.dialog.map((line, index) => (
                      <li key={`${state}-${index}`} className="border-b border-dark-field-border py-4">
                        <p className="font-mono text-label text-dark-text">{line.who}</p>
                        <p className="mt-1">{line.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <p className="mt-16 max-w-[46ch] border-t border-dark-field-border pt-8 text-[1.2rem] leading-snug">
              Le boîtier n&rsquo;éteint un appareil que si vous le lui demandez. Quand la panne demande une
              intervention sur place, il vous dit quoi vérifier au lieu d&rsquo;agir à votre place.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <h2 className="max-w-[20ch] text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
              Plusieurs façons de lui parler
            </h2>
            <p className="mt-4 max-w-[60ch] text-text-secondary">
              Une même demande se dit de plusieurs manières : pas besoin de retenir une formule exacte. Commencez
              toujours par « Hey Nouankany ».
            </p>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {BOITIER_PHRASES.map((group) => (
                <div key={group.title} className="border-t-2 border-text-primary pt-4">
                  <h3 className="text-[1.05rem] font-bold text-text-primary">{group.title}</h3>
                  <ul className="mt-3 flex flex-col gap-1.5 text-text-secondary">
                    {group.phrases.map((phrase) => (
                      <li key={phrase}>&laquo;&nbsp;{phrase}&nbsp;&raquo;</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
