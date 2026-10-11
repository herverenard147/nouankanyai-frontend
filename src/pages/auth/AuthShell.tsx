import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Cadre commun des pages de compte hors connexion (mot de passe oublié, lien reçu par email). */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Nouankany" className="h-10 w-10 object-contain" />
          <h1 className="text-h2-secondary font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link to="/login" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
