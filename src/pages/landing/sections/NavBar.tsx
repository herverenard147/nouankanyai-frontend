import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'

const LINKS = [
  { to: '/#probleme', label: 'Le problème' },
  { to: '/#profils', label: 'Pour qui' },
  { to: '/le-boitier', label: 'Le boîtier' },
  { to: '/#apropos', label: 'Qui sommes-nous' },
  { to: '/#confiance', label: 'Notre engagement' },
  { to: '/#formules', label: 'Formules' },
]

export function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 bg-dark-bg/95 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Nouankany" className="h-[34px] w-[34px] object-contain" />
          <span className="text-[1.05rem] font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Nouankany
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="text-[0.92rem] text-white/85 hover:text-white">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/login"
            className="focus-ring inline-flex min-h-11 items-center border border-white/60 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Se connecter
          </Link>
          <Link
            to="/demander-un-audit"
            className="focus-ring inline-flex min-h-11 items-center bg-accent px-5 py-3.5 text-sm font-semibold text-text-primary hover:brightness-110"
          >
            Demander un audit
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Ouvrir le menu"
          className="focus-ring border border-white/60 p-2 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="border-t border-white/20 bg-dark-bg px-6 py-4 lg:hidden">
          <ul className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="text-sm text-white/85 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/login"
              className="focus-ring inline-flex min-h-11 items-center justify-center border border-white/60 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Se connecter
            </Link>
            <Link
              to="/demander-un-audit"
              onClick={() => setOpen(false)}
              className="focus-ring inline-flex min-h-11 items-center justify-center bg-accent px-5 py-3 text-sm font-semibold text-text-primary hover:brightness-110"
            >
              Demander un audit
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
