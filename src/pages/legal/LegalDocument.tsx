import { Footer } from '@/pages/landing/sections/Footer'
import { NavBar } from '@/pages/landing/sections/NavBar'

/** Public concerné par une section : tous les comptes, ou un type de compte. */
export type LegalScope = 'Tous les comptes' | 'Ménage' | 'PME' | 'Industrie' | 'PME et Industrie'
export type LegalBlock = string | { list: string[] }
export interface LegalSection {
  id: string
  title: string
  scope: LegalScope
  blocks: LegalBlock[]
}

const SCOPE_STYLE: Record<LegalScope, string> = {
  'Tous les comptes': 'border-border text-text-secondary',
  Ménage: 'border-accent-cta text-accent-cta',
  PME: 'border-text-primary text-text-primary',
  Industrie: 'border-text-primary text-text-primary',
  'PME et Industrie': 'border-text-primary text-text-primary',
}

/**
 * Document légal en page (demande du propriétaire, 2026-10-21 : plus de fenêtre). Sommaire, puis chaque section avec le
 * type de compte qu'elle concerne, pour que chacun trouve vite les règles qui s'appliquent à lui.
 */
export function LegalDocument({ kicker, title, intro, updated, sections }: { kicker: string; title: string; intro: string; updated: string; sections: LegalSection[] }) {
  return (
    <>
      <NavBar />
      <main id="main-content">
        <section className="border-b border-border py-14">
          <div className="mx-auto max-w-[52rem] px-6">
            <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">{kicker}</p>
            <h1 className="mt-2 text-h1 font-bold text-text-primary">{title}</h1>
            <p className="mt-4 text-lede text-text-secondary">{intro}</p>
            <p className="mt-3 text-sm text-text-secondary">Dernière mise à jour : {updated}.</p>
          </div>
        </section>
        <div className="mx-auto flex max-w-[52rem] flex-col gap-10 px-6 py-12">
          <nav aria-label="Sommaire" className="border-y border-border py-5">
            <h2 className="text-sm font-semibold text-text-primary">Sommaire</h2>
            <ol className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="focus-ring text-accent-cta hover:underline">
                    {i + 1}. {s.title}
                  </a>{' '}
                  {s.scope !== 'Tous les comptes' && <span className="text-xs text-text-secondary">({s.scope})</span>}
                </li>
              ))}
            </ol>
          </nav>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titre`} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 id={`${s.id}-titre`} className="text-section-title font-semibold text-text-primary">
                  {i + 1}. {s.title}
                </h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SCOPE_STYLE[s.scope]}`}>{s.scope}</span>
              </div>
              <div className="mt-3 flex flex-col gap-3 text-[0.95rem] leading-relaxed text-text-secondary">
                {s.blocks.map((b, j) =>
                  typeof b === 'string' ? (
                    <p key={j}>{b}</p>
                  ) : (
                    <ul key={j} className="flex list-disc flex-col gap-1.5 pl-5">
                      {b.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
          <p className="border-t border-border pt-6 text-sm text-text-secondary">
            Une question sur ce document :{' '}
            <a href="mailto:contact@nouankany.com" className="font-semibold text-accent-cta hover:underline">
              contact@nouankany.com
            </a>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
