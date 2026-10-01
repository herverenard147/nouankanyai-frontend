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
    <section className="bg-accent py-16 text-text-primary lg:py-20">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-end gap-8 px-6 lg:grid-cols-[6fr_5fr] lg:gap-16">
        <div>
          <p className="font-mono text-sm font-semibold">Bientôt disponible</p>
          <h2 className="mt-2.5 text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em]">
            Soyez parmi les premiers utilisateurs
          </h2>
          <p className="mt-3.5 max-w-[48ch]">
            Le produit est en développement actif. Laissez votre email pour être informé à l&rsquo;ouverture des
            inscriptions, sans spam.
          </p>
        </div>

        <div>
          {success ? (
            <p className="font-semibold">
              Merci, votre email est enregistré. Nous vous préviendrons à l&rsquo;ouverture des inscriptions.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                aria-label="Adresse email"
                className="focus-ring min-h-12 min-w-0 flex-1 border-0 bg-white px-4 text-base text-text-primary placeholder:text-text-tertiary"
              />
              <button
                type="submit"
                disabled={mutation.isPending}
                className="focus-ring min-h-12 bg-dark-bg px-6 text-base font-semibold text-white hover:bg-dark-field disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mutation.isPending ? 'Envoi…' : 'Me prévenir'}
              </button>
            </form>
          )}
          {errorMessage && <p className="mt-2 font-semibold">{errorMessage}</p>}
        </div>
      </div>
    </section>
  )
}
