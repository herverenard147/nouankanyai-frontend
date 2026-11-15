import { NavLink, useLocation } from 'react-router-dom'

import { NAV_BY_PROFILE } from '@/lib/navConfig'
import type { Profile } from '@/types/domain'

/** Page parente et pages rangées sous elle (`under`) pour la page affichée ; vide si la page n'appartient à aucun groupe. */
export function relatedPages(profile: Profile, pathname: string) {
  const entries = NAV_BY_PROFILE[profile]
  const current = entries
    .filter((entry) => pathname === entry.path || pathname.startsWith(`${entry.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
  if (!current) return []
  const parentPath = current.under ?? current.path
  const children = entries.filter((entry) => entry.under === parentPath)
  const parent = entries.find((entry) => entry.path === parentPath)
  return parent && children.length > 0 ? [parent, ...children] : []
}

/** Rangée de liens affichée en haut d'une page parente et de ses pages rangées : rien n'est introuvable depuis le menu resserré. */
export function RelatedPages({ profile }: { profile: Profile }) {
  const { pathname } = useLocation()
  const pages = relatedPages(profile, pathname)
  if (pages.length === 0) return null
  return (
    <nav aria-label="Pages liées" className="-mb-1">
      <ul className="flex flex-wrap gap-2">
        {pages.map((page, index) => (
          <li key={page.path}>
            <NavLink
              to={page.path}
              end={index === 0}
              className={({ isActive }) =>
                `inline-block rounded-control border px-3 py-1.5 text-sm ${
                  isActive ? 'border-text-primary bg-card font-semibold text-text-primary' : 'border-border text-text-secondary hover:text-text-primary'
                }`
              }
            >
              {page.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
