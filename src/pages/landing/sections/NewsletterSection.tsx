import { useState } from 'react'
import type { FormEvent } from 'react'

import { useNewsletterSignup } from '@/hooks/queries/useNewsletterSignup'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const mutation = useNewsletterSignup()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate(email)
  }

  const success = mutation.data?.ok === true
  const errorMessage = mutation.data && !mutation.data.ok ? mutation.data.message : null

  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="rounded-newsletter bg-dark-bg p-6 sm:p-11">
          <p className="font-mono text-[0.78rem] font-semibold uppercase tracking-wide text-dark-text">
            Bientôt disponible
          </p>
          <h2 className="mt-2 text-[1.6rem] font-bold text-white">Soyez parmi les premiers utilisateurs</h2>
          <p className="mt-2 max-w-[48ch] text-dark-text">
            Le produit est en développement actif. Laissez votre email pour être informé à l&rsquo;ouverture des
            inscriptions, sans spam.
          </p>

          {success ? (
            <p className="mt-5 max-w-[420px] text-sm font-semibold text-white">
              Merci, votre email est enregistré. Nous vous préviendrons à l&rsquo;ouverture des inscriptions.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex max-w-[420px] flex-wrap gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                aria-label="Adresse email"
                className="focus-ring min-h-11 min-w-0 flex-1 rounded-control border border-dark-field-border bg-dark-field px-3.5 py-3 text-sm text-white placeholder:text-dark-text"
              />
              <button
                type="submit"
                disabled={mutation.isPending}
                className="focus-ring min-h-11 rounded-control bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-cta disabled:opacity-60"
              >
                {mutation.isPending ? 'Envoi…' : 'Me prévenir'}
              </button>
            </form>
          )}
          {errorMessage && <p className="mt-2 text-sm text-alert">{errorMessage}</p>}
        </div>
      </div>
    </section>
  )
}
