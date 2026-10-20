import { Link, useLocation } from 'react-router-dom'

import { NAV_BY_PROFILE } from '@/lib/navConfig'
import { useBreadcrumbStore } from '@/store/breadcrumbStore'
import type { Profile } from '@/types/domain'

/** Segments connus sous une page (le reste est un identifiant : le nom donné par la page, sinon « Détail »). */
const SEGMENT_LABEL: Record<string, string> = { alertes: 'Alertes', sources: 'Sources de mesures' }

const OUTSIDE_MENU: { path: string; label: string; under?: string }[] = [{ path: '/app/boitier', label: 'Boîtier' }]

export interface Crumb {
  label: string
  to?: string
}

/** Fil d'Ariane d'une adresse : Vue d'ensemble › page du menu › sous-pages. Le dernier élément n'est pas un lien. */
export function crumbsFor(profile: Profile, pathname: string, detailLabel: string | null): Crumb[] {
  const entries = NAV_BY_PROFILE[profile]
  // Pages hors du menu de ce profil mais atteignables (le boîtier d'un compte industrie, depuis les sources).
  const known = [...entries, ...OUTSIDE_MENU.filter((o) => !entries.some((e) => e.path === o.path))]
  const entry = known.sort((a, b) => b.path.length - a.path.length).find((e) => pathname === e.path || pathname.startsWith(`${e.path}/`))
  if (!entry) return []
  const home = entries.find((e) => e.path === '/app/apercu')
  const crumbs: Crumb[] = []
  // Une page rangée sous une autre dans le menu (« under ») a ce parent dans le fil ; sinon, la Vue d'ensemble.
  const parent = entry.under ? entries.find((e) => e.path === entry.under) : home
  if (parent && parent.path !== entry.path) crumbs.push({ label: parent.label, to: parent.path })
  crumbs.push({ label: entry.label, to: entry.path })
  const rest = pathname.slice(entry.path.length).split('/').filter(Boolean)
  let path = entry.path
  rest.forEach((segment, i) => {
    path = `${path}/${segment}`
    const last = i === rest.length - 1
    const known = SEGMENT_LABEL[segment]
    crumbs.push({ label: known ?? (last ? (detailLabel ?? 'Détail') : 'Compte'), to: path })
  })
  return crumbs.map((c, i) => (i === crumbs.length - 1 ? { label: c.label } : c))
}

export function Breadcrumb({ profile }: { profile: Profile }) {
  const location = useLocation()
  const detailLabel = useBreadcrumbStore((s) => s.label)
  const crumbs = crumbsFor(profile, location.pathname, detailLabel)
  if (crumbs.length < 2) return null
  return (
    <nav aria-label="Fil d’Ariane" className="mt-2 text-sm text-text-secondary">
      <ol className="flex flex-wrap items-center gap-x-1.5">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-x-1.5">
            {i > 0 && <span aria-hidden="true">›</span>}
            {c.to ? (
              <Link to={c.to} className="focus-ring font-medium text-accent-cta hover:underline">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-text-primary">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
