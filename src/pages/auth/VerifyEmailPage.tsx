import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { verifyEmail } from '@/api/account'
import { ApiError } from '@/lib/apiClient'
import { AuthShell } from '@/pages/auth/AuthShell'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, setState] = useState<{ status: 'loading' | 'done' | 'error'; message?: string }>(
    token ? { status: 'loading' } : { status: 'error', message: "Ce lien n'est pas valable." },
  )
  // Le lien ne sert qu'une fois : un second appel (double rendu en développement) le refuserait.
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    verifyEmail(token)
      .then(() => setState({ status: 'done' }))
      .catch((e) => setState({ status: 'error', message: e instanceof ApiError ? e.message : 'Une erreur inattendue est survenue.' }))
  }, [token])

  return (
    <AuthShell title="Confirmation de votre adresse">
      {state.status === 'loading' && <p className="text-center text-sm text-text-secondary">Vérification en cours…</p>}
      {state.status === 'done' && (
        <p className="rounded-control border border-border bg-bg-elevated p-4 text-sm text-text-secondary" role="status">
          Votre adresse est confirmée. Merci.
        </p>
      )}
      {state.status === 'error' && (
        <p className="text-center text-sm text-alert" role="alert">
          {state.message} Vous pouvez demander un nouveau lien dans Paramètres.
        </p>
      )}
    </AuthShell>
  )
}
