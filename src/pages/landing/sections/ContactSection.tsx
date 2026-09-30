import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useSendContactMessage } from '@/hooks/queries/useContact'

function MessageForm() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const mutation = useSendContactMessage()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ nom, email, message })
  }

  if (mutation.isSuccess) {
    return (
      <p className="font-semibold text-confirm">
        Merci, votre message a bien été envoyé. Nous vous répondrons par email sous 48h ouvrées.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField label="Nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
      <TextField
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact-message" className="text-sm font-medium text-text-primary">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="focus-ring rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
          placeholder="Écrivez-nous ce que vous voulez"
        />
      </div>
      <div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </div>
      {mutation.isError && <p className="text-sm text-alert">Échec de l&rsquo;envoi. Réessayez.</p>}
    </form>
  )
}

export function ContactSection() {
  return (
    <section id="contact" className="bg-bg-elevated py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="max-w-[20ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
          Une question, un projet ? Écrivez-nous
        </h2>
        <p className="mt-3.5 text-text-secondary">Nous répondons habituellement sous 48h ouvrées.</p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[6fr_5fr] lg:gap-[72px]">
          <div>
            <h3 className="text-2xl font-bold tracking-[-0.015em] text-text-primary">Écrivez-nous</h3>
            <p className="mb-6 mt-2 text-text-secondary">
              Dites-nous ce dont vous avez besoin, nous vous répondons par email.
            </p>
            <MessageForm />
          </div>

          <div className="flex flex-col gap-8 lg:pt-1.5">
            <div>
              <h3 className="text-xl font-bold tracking-[-0.01em] text-text-primary">Par email</h3>
              <p className="mt-1.5">
                <a
                  href="mailto:contact@nouankany.com"
                  className="font-semibold text-accent-cta hover:text-accent-cta-hover"
                >
                  contact@nouankany.com
                </a>
              </p>
            </div>

            <div className="border-t border-border pt-7">
              <h3 className="text-xl font-bold tracking-[-0.01em] text-text-primary">
                Vous êtes une PME ou une Industrie ?
              </h3>
              <p className="mt-1.5 text-text-secondary">
                Pour une demande d&rsquo;audit énergétique, passez directement par le formulaire dédié, votre
                demande est traitée par l&rsquo;équipe commerciale.
              </p>
              <Link
                to="/demander-un-audit"
                className="focus-ring mt-4 inline-flex min-h-12 items-center bg-accent px-6 py-3.5 text-base font-semibold text-text-primary hover:brightness-110"
              >
                Demander un audit
              </Link>
            </div>

            <div className="border-t border-border pt-7">
              <h3 className="text-xl font-bold tracking-[-0.01em] text-text-primary">Une question sur le produit ?</h3>
              <p className="mt-1.5 text-text-secondary">
                Consultez d&rsquo;abord la{' '}
                <Link to="/#faq" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
                  FAQ
                </Link>
                , la réponse s&rsquo;y trouve peut-être déjà.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
