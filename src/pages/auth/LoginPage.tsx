import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { DEMO_ACCOUNTS } from '@/data/demoAccounts'
import { ACCOUNT_TYPE_LABELS } from '@/lib/profileMapping'
import { firstRouteFor } from '@/lib/navConfig'
import { useSessionStore } from '@/store/sessionStore'
import type { Profile } from '@/types/domain'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ACCOUNT_TYPES: Exclude<Profile, 'admin'>[] = ['menage', 'pme', 'industrie']

export function LoginPage() {
  const session = useSessionStore((s) => s.session)
  const login = useSessionStore((s) => s.login)
  const signup = useSessionStore((s) => s.signup)
  const location = useLocation()
  const [searchParams] = useSearchParams()

  const [mode, setMode] = useState<'login' | 'signup'>(searchParams.get('mode') === 'signup' ? 'signup' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const typeParam = searchParams.get('type')
  const [accountType, setAccountType] = useState<Exclude<Profile, 'admin'>>(
    typeParam === 'pme' || typeParam === 'industrie' ? typeParam : 'menage',
  )
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [nomError, setNomError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')

  if (session) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? firstRouteFor(session.profile)
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const nextEmailError = EMAIL_RE.test(email) ? null : 'Entrez une adresse email valide.'
    const nextPasswordError =
      mode === 'signup' && password.length < 6 ? 'Le mot de passe doit contenir au moins 6 caractères.' : password.length === 0 ? 'Le mot de passe est requis.' : null
    const nextNomError = mode === 'signup' && nom.trim().length === 0 ? 'Le nom est requis.' : null
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    setNomError(nextNomError)
    if (nextEmailError || nextPasswordError || nextNomError) return

    setStatus('loading')
    const result =
      mode === 'login'
        ? await login(email, password)
        : await signup(email, password, nom, ACCOUNT_TYPE_LABELS[accountType])
    setStatus('idle')

    if (!result.ok) {
      setFormError(result.message)
    }
    // La redirection se fait via le `if (session)` ci-dessus au prochain rendu.
  }

  return (
    <div id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Nouankany" className="h-10 w-10 object-contain" />
          <h1 className="text-h2-secondary font-bold text-text-primary">{mode === 'login' ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="text-sm text-text-secondary">Accédez à votre dashboard Nouankany.</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5 rounded-control bg-bg-elevated p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`focus-ring min-w-0 flex-1 rounded-control px-3 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`focus-ring min-w-0 flex-1 rounded-control px-3 py-2 text-sm font-semibold ${mode === 'signup' ? 'bg-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          {mode === 'signup' && (
            <>
              <TextField label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} error={nomError ?? undefined} required />
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-primary">Type de compte</span>
                <div className="flex gap-2">
                  {ACCOUNT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      className={`focus-ring min-w-0 flex-1 rounded-control border px-3 py-2 text-sm font-medium ${
                        accountType === type ? 'border-text-primary bg-text-primary text-white' : 'border-border text-text-secondary'
                      }`}
                    >
                      {ACCOUNT_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError ?? undefined}
            required
          />
          <PasswordField
            label="Mot de passe"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError ?? undefined}
            required
          />
          {mode === 'login' && (
            <button type="button" disabled className="w-fit cursor-not-allowed text-sm text-text-tertiary" aria-disabled="true">
              Mot de passe oublié ?
            </button>
          )}

          {formError && (
            <p className="text-sm text-alert" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={status === 'loading'} className="w-full">
            {status === 'loading' ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link to="/" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            Retour à la landing
          </Link>
        </p>

        <div className="mt-8 rounded-card border border-border bg-bg-elevated p-4">
          <p className="font-mono text-mono-badge font-semibold uppercase tracking-wide text-text-secondary">
            Comptes de démonstration
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs text-text-secondary">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex flex-wrap justify-between gap-x-2 gap-y-0.5 font-mono">
                <span className="min-w-0 break-all">{account.email}</span>
                <span>{account.password}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
