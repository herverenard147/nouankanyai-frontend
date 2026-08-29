import { useState } from 'react'
import { Link } from 'react-router-dom'

const LINKS = [
  { href: '#probleme', label: 'Le problème' },
  { href: '#profils', label: 'Pour qui' },
  { href: '#apropos', label: 'Qui sommes-nous' },
  { href: '#confiance', label: 'Notre engagement' },
  { href: '#formules', label: 'Formules' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-bg/92 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Nouankany" className="h-[34px] w-[34px] object-contain" />
          <span className="text-[1.05rem] font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
            Nouankany
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link to={`/${link.href}`} className="text-[0.92rem] text-text-secondary hover:text-text-primary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/login"
            className="focus-ring inline-flex min-h-11 items-center rounded-control border border-border px-5 py-3.5 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
          >
            Se connecter
          </Link>
          <Link
            to="/demander-un-audit"
            className="focus-ring inline-flex min-h-11 items-center rounded-control bg-accent-cta px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-cta-hover"
          >
            Demander un audit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Ouvrir le menu"
          className="focus-ring rounded-control border border-border p-2 lg:hidden"
        >
          ☰
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-6 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={`/${link.href}`}
                  onClick={() => setOpen(false)}
                  className="text-sm text-text-secondary hover:text-text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/login"
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-control border border-border px-5 py-3 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
            >
              Se connecter
            </Link>
            <Link
              to="/demander-un-audit"
              onClick={() => setOpen(false)}
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-control bg-accent-cta px-5 py-3 text-sm font-semibold text-white hover:bg-accent-cta-hover"
            >
              Demander un audit
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
