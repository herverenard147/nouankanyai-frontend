import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { BoitierViewer } from '@/components/boitier/BoitierViewer'
import { DEMO_CYCLE, WAKE_PHRASE } from '@/components/boitier/boitierStates'
import { useReducedMotion } from '@/components/boitier/useReducedMotion'

/** Annonce du boîtier sur l'accueil : la lumière passe en boucle du vert au rouge, la page dédiée raconte le reste. */
export function BoitierSection() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % DEMO_CYCLE.length), 4000)
    return () => window.clearInterval(id)
  }, [reduced])

  const state = reduced ? 'vert' : DEMO_CYCLE[index]

  return (
    <section id="boitier" className="bg-dark-bg py-20 text-white lg:py-28">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-2 lg:gap-[72px]">
        <div>
          <h2 className="max-w-[18ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em]">
            Un boîtier qui dit l&rsquo;état de vos appareils.
          </h2>
          <p className="mt-5 max-w-[50ch] text-[1.2rem] leading-snug text-dark-text">
            Une lumière verte, orange ou rouge pour l&rsquo;état général, et une voix qui répond quand on lui
            parle : &laquo;&nbsp;{WAKE_PHRASE}, donne-moi l&rsquo;état de mes appareils&nbsp;&raquo;.
          </p>
          <p className="mt-8">
            <Link
              to="/le-boitier"
              className="focus-ring text-[1.1rem] font-semibold underline underline-offset-4 hover:opacity-80"
            >
              Découvrir le boîtier →
            </Link>
          </p>
        </div>
        <div className="bg-dark-field px-4 py-8" aria-hidden="true">
          <BoitierViewer state={state} className="aspect-[4/3] w-full" />
        </div>
      </div>
    </section>
  )
}
