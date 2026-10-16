import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { MIN_PASSWORD_LENGTH } from '@/lib/validation'
import { resetPassword } from '@/api/account'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/PasswordField'
import { ApiError } from '@/lib/apiClient'
import { AuthShell } from '@/pages/auth/AuthShell'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`)
    if (password !== confirm) return setError('Les deux mots de passe ne sont pas identiques.')
    setError(null)
    setStatus('loading')
    try {
      await resetPassword(token, password)
      setStatus('done')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Une erreur inattendue est survenue.')
      setStatus('idle')
    }
  }

  if (!token) {
    return (
      <AuthShell title="Lien incomplet">
        <p className="text-center text-sm text-text-secondary" role="alert">
          Ce lien n&rsquo;est pas valable.{' '}
          <Link to="/mot-de-passe-oublie" className="font-semibold text-accent-cta">
            Demandez-en un nouveau.
          </Link>
        </p>
      </AuthShell>
    )
  }

  if (status === 'done') {
    return (
      <AuthShell title="Mot de passe changé">
        <p className="rounded-control border border-border bg-bg-elevated p-4 text-sm text-text-secondary" role="status">
          Votre nouveau mot de passe est enregistré. Toutes vos sessions ouvertes ont été fermées : reconnectez-vous.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Nouveau mot de passe">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PasswordField label="Nouveau mot de passe" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordField label="Confirmer le mot de passe" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        {error && (
          <p className="text-sm text-alert" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={status === 'loading'} className="w-full">
          {status === 'loading' ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </form>
    </AuthShell>
  )
}
