import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export interface Shortcut {
  to: string
  label: string
  /** État court à droite (« Aucune donnée », un nombre…), jamais un texte explicatif. */
  status?: ReactNode
}

/** Raccourcis vers les pages de détail qui ne tiennent pas sur la vue d'ensemble. */
export function ShortcutList({ title = 'Raccourcis', items }: { title?: string; items: Shortcut[] }) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-2">
      <h2 className="text-base font-bold text-text-primary">{title}</h2>
      <ul className="border-b border-border">
        {items.map((item) => (
          <li key={item.to + item.label} className="border-t border-border">
            <Link
              to={item.to}
              className="focus-ring flex min-h-11 items-center justify-between gap-3 transition-colors hover:bg-bg-elevated"
            >
              <span className="text-[0.8125rem] font-semibold text-text-primary">{item.label}</span>
              <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                {item.status}
                <ArrowRight className="h-4 w-4 text-accent-cta" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Les trois paliers tarifaires CIE en miniature (mêmes couleurs que TariffBar). */
export function TariffMini() {
  return (
    <span className="flex h-3.5 w-28 overflow-hidden" aria-hidden="true">
      <span className="flex-1 bg-tariff-creuses" />
      <span className="flex-[1.2] bg-tariff-pleines" />
      <span className="flex-1 bg-tariff-pointe" />
    </span>
  )
}
