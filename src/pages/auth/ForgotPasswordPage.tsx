import { useState } from 'react'
import type { FormEvent } from 'react'

import { forgotPassword } from '@/api/account'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { ApiError } from '@/lib/apiClient'
import { AuthShell } from '@/pages/auth/AuthShell'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!EMAIL_RE.test(email)) {
      setError('Entrez une adresse email valide.')
      return
    }
    setError(null)
    setStatus('loading')
    try {
      await forgotPassword(email)
      setStatus('sent')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Une erreur inattendue est survenue.')
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <AuthShell title="Vérifiez vos emails">
        <p className="rounded-control border border-border bg-bg-elevated p-4 text-sm text-text-secondary" role="status">
          Si un compte existe pour cette adresse, un email vient de lui être envoyé. Le lien est valable 30 minutes.
          Pensez à regarder dans les courriers indésirables.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Mot de passe oublié" subtitle="Recevez un lien pour choisir un nouveau mot de passe.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ?? undefined}
          required
        />
        <Button type="submit" disabled={status === 'loading'} className="w-full">
          {status === 'loading' ? 'Envoi…' : 'Recevoir le lien'}
        </Button>
      </form>
    </AuthShell>
  )
}
