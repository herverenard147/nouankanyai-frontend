import { Suspense, lazy, useCallback, useState } from 'react'

import { Boitier2D } from '@/components/boitier/Boitier2D'
import { BOITIER_PHRASES, BOITIER_STATES } from '@/components/boitier/boitierStates'
import type { BoitierState } from '@/components/boitier/boitierStates'
import { Footer } from '@/pages/landing/sections/Footer'
import { NavBar } from '@/pages/landing/sections/NavBar'

// Vue éclatée (bibliothèque 3D et modèle chargés à la demande, seulement sur cette page).
const BoitierEclate = lazy(() => import('@/components/boitier/BoitierEclate'))

export function BoitierPage() {
  const [state, setState] = useState<BoitierState>('rouge')
  const [no3d, setNo3d] = useState(false)
  const onUnavailable = useCallback(() => setNo3d(true), [])

  return (
    <>
      <NavBar />
      <main id="main-content">
        <section className="bg-dark-bg py-12 text-white lg:py-16">
          <div className="mx-auto max-w-[75rem] px-6">
            <h1 className="max-w-[20ch] text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.025em]">
              Un coup d&rsquo;œil, et vous savez.
            </h1>
            <p className="mt-5 max-w-[48ch] text-[1.2rem] leading-snug text-dark-text">
              Vert, tout va bien. Orange, il surveille. Rouge, il vous dit quoi faire.
            </p>

            <div className="mt-8 grid items-start gap-10 lg:mt-10 lg:grid-cols-2 lg:gap-14">
              <div className="bg-dark-field px-2 py-3 sm:px-4 sm:py-4">
                {no3d ? (
                  <Boitier2D state={state} />
                ) : (
                  <Suspense fallback={<Boitier2D state={state} />}>
                    <BoitierEclate state={state} onUnavailable={onUnavailable} />
                  </Suspense>
                )}
                <p className="mt-4 text-center text-sm text-dark-text">
                  Glissez pour le faire tourner. « Éclaté » pour l&rsquo;ouvrir, puis touchez une pièce.
                </p>
              </div>

              <div>
                <div
                  role="group"
                  aria-label="État affiché par le boîtier"
                  className="grid grid-cols-2 gap-px bg-dark-field-border"
                >
                  {BOITIER_STATES.map((item) => {
                    const selected = item.id === state
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setState(item.id)}
                        className={`focus-ring flex min-h-12 items-center justify-center gap-3 px-4 py-2 text-[0.95rem] font-semibold ${
                          selected ? 'bg-white text-text-primary' : 'bg-dark-bg text-white hover:bg-white/10'
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

                {/* Tous les états sont posés dans la même case : la colonne prend la hauteur du plus long
                    (« Action requise ») et ne bouge plus quand on change d'état. */}
                <div aria-live="polite" className="mt-6 grid">
                  {BOITIER_STATES.map((item) => (
                    <div
                      key={item.id}
                      aria-hidden={item.id !== state}
                      className={`[grid-area:1/1] ${item.id === state ? '' : 'invisible'}`}
                    >
                      <p className="text-[1.15rem] font-semibold">{item.meaning}</p>
                      <ol className="mt-6 flex flex-col gap-3">
                        {item.dialog.map((line, index) => (
                          <li
                            key={index}
                            className={`max-w-[85%] px-4 py-3 ${
                              line.who === 'Vous' ? 'self-end bg-white text-text-primary' : 'self-start bg-dark-field'
                            }`}
                          >
                            <p
                              className={`font-mono text-label ${line.who === 'Vous' ? 'text-text-secondary' : 'text-dark-text'}`}
                            >
                              {line.who}
                            </p>
                            <p className="mt-1">{line.text}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mx-auto mt-10 max-w-[46ch] border-t border-dark-field-border pt-6 text-center text-[1.2rem] leading-snug">
              Il n&rsquo;éteint rien sans votre accord.
            </p>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-[75rem] px-6">
            <h2 className="max-w-[20ch] text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
              Parlez-lui normalement
            </h2>
            <p className="mt-4 max-w-[60ch] text-text-secondary">
              Dites « Hey Nouankany », puis demandez avec vos mots.
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
