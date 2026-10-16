import { useMemo, useState } from 'react'

import { errorsFor } from '@/data/aide/erreurs'
import type { ErrorEntry } from '@/data/aide/erreurs'
import { GUIDES } from '@/data/aide/guides'
import type { Block } from '@/data/aide/guides'
import { useScrollToHash } from '@/lib/useScrollToHash'
import { useSessionStore } from '@/store/sessionStore'

/**
 * Aide (documentation de chaque acteur, 2026-10-16) : chaque profil lit son propre guide (ménage, PME, industrie,
 * technicien, administrateur), puis les messages d'erreur qui peuvent lui arriver, avec leur sens et leur solution.
 * Les écrans renvoient ici par « Que faire ? » (ancre #erreur-<id>).
 */
export function HelpPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const [query, setQuery] = useState('')
  useScrollToHash()

  const errors = useMemo(() => (profile ? errorsFor(profile) : []), [profile])
  const shown = useMemo(() => {
    const q = normalize(query)
    if (!q) return errors
    return errors.filter((e) => normalize(`${e.message} ${e.meaning} ${e.where}`).includes(q))
  }, [errors, query])

  if (!profile) return null
  const guide = GUIDES[profile]

  return (
    <div className="flex max-w-[56rem] flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-heading text-[1.4rem] font-bold tracking-[-0.02em] text-text-primary">{guide.title}</h2>
        <p className="text-sm text-text-secondary">{guide.intro}</p>
      </header>

      <nav aria-label="Sommaire" className="border-t-2 border-text-primary pt-3">
        <ol className="flex flex-col gap-1 text-sm">
          {guide.sections.map((section) => (
            <li key={section.id}>
              <a className="focus-ring text-accent-cta underline-offset-2 hover:underline" href={`#${section.id}`}>
                {section.title}
              </a>
            </li>
          ))}
          <li>
            <a className="focus-ring text-accent-cta underline-offset-2 hover:underline" href="#erreurs">
              Messages d’erreur : ce qu’ils veulent dire, comment les résoudre
            </a>
          </li>
        </ol>
      </nav>

      {guide.sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titre`} className="flex scroll-mt-6 flex-col gap-3 border-t border-border pt-4">
          <h3 id={`${section.id}-titre`} className="text-section-title font-bold text-text-primary">
            {section.title}
          </h3>
          {section.blocks.map((block, index) => (
            <HelpBlock key={index} block={block} />
          ))}
        </section>
      ))}

      <section id="erreurs" aria-labelledby="erreurs-titre" className="flex scroll-mt-6 flex-col gap-3 border-t-2 border-text-primary pt-4">
        <h3 id="erreurs-titre" className="text-section-title font-bold text-text-primary">
          Messages d’erreur
        </h3>
        <p className="text-sm text-text-secondary">
          Le message affiché à l’écran, ce qu’il veut dire et comment le résoudre. Quand un écran montre l’un de ces messages, le lien « Que faire ? » ouvre directement sa fiche.
        </p>
        <label className="flex max-w-[28rem] flex-col gap-1 text-sm font-medium text-text-primary">
          Chercher un message
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Par exemple : clé, unité, colonne"
            className="focus-ring min-h-11 rounded-control border border-border bg-bg px-3 text-sm font-normal"
          />
        </label>
        {shown.length === 0 ? (
          <p className="text-sm text-text-secondary">Aucun message ne correspond. Écrivez à contact@nouankany.com en recopiant le message exact.</p>
        ) : (
          <div className="flex flex-col">
            {shown.map((entry) => (
              <ErrorCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ErrorCard({ entry }: { entry: ErrorEntry }) {
  return (
    <article id={`erreur-${entry.id}`} className="flex scroll-mt-6 flex-col gap-1.5 border-t border-border py-3 target:bg-bg-elevated">
      <h4 className="text-sm font-semibold text-text-primary">« {entry.message} »</h4>
      <p className="text-xs text-text-secondary">Où : {entry.where}</p>
      <p className="text-sm text-text-primary">
        <span className="font-medium">Ce que ça veut dire : </span>
        {entry.meaning}
      </p>
      <div className="text-sm text-text-primary">
        <span className="font-medium">Que faire :</span>
        <ul className="mt-1 list-disc pl-5">
          {entry.fix.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function HelpBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p className="text-sm leading-relaxed text-text-primary">{block.text}</p>
    case 'note':
      return <p className="border-l-2 border-accent pl-3 text-sm text-text-primary">{block.text}</p>
    case 'steps':
      return (
        <ol className="list-decimal pl-5 text-sm leading-relaxed text-text-primary">
          {block.items.map((item) => (
            <li key={item} className="py-0.5">
              {item}
            </li>
          ))}
        </ol>
      )
    case 'list':
      return (
        <ul className="list-disc pl-5 text-sm leading-relaxed text-text-primary">
          {block.items.map((item) => (
            <li key={item} className="py-0.5">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'download':
      return (
        <a href={block.href} download className="focus-ring w-fit text-sm font-medium text-accent-cta underline underline-offset-2">
          {block.label}
        </a>
      )
    case 'code':
      return <pre className="overflow-x-auto bg-dark-bg p-3 text-xs leading-relaxed text-dark-text">{block.text}</pre>
    case 'table':
      return (
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse sm:min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-text-primary">
                {block.head.map((h) => (
                  <th key={h} scope="col" className="py-2 pr-4 font-semibold text-text-primary">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join('|')} className="border-b border-border align-top">
                  {row.map((cell, i) => (
                    <td key={i} className="py-2 pr-4 text-text-primary">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}
