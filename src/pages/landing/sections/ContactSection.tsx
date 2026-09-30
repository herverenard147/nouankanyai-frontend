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
      <p className="text-sm font-semibold text-confirm">
        Merci, votre message a bien été envoyé. Nous vous répondrons par email sous 48h ouvrées.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      <Button type="submit" disabled={mutation.isPending} className="mt-1 w-fit">
        {mutation.isPending ? 'Envoi…' : 'Envoyer'}
      </Button>
      {mutation.isError && <p className="text-sm text-alert">Échec de l&rsquo;envoi. Réessayez.</p>}
    </form>
  )
}

export function ContactSection() {
  return (
    <section id="contact" className="border-t border-border py-16">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-10 flex max-w-[60ch] flex-col gap-2">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">Contact</p>
          <h2 className="text-h2-section font-bold text-text-primary">Une question, un projet ? Écrivez-nous</h2>
          <p className="text-small-body text-text-secondary">Nous répondons habituellement sous 48h ouvrées.</p>
        </div>

        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
          <div className="rounded-card border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-text-primary">Écrivez-nous</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Dites-nous ce dont vous avez besoin, nous vous répondons par email.
            </p>
            <div className="mt-4">
              <MessageForm />
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-card border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-text-primary">Par email</h3>
              <p className="mt-1 text-sm text-text-secondary">
                <a href="mailto:contact@nouankany.demo" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
                  contact@nouankany.demo
                </a>
              </p>
            </div>

            <div className="rounded-card border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-text-primary">Vous êtes une PME ou une Industrie ?</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Pour une demande d&rsquo;audit énergétique, passez directement par le formulaire dédié, votre
                demande est traitée par l&rsquo;équipe commerciale.
              </p>
              <Link
                to="/demander-un-audit"
                className="focus-ring mt-4 inline-flex min-h-11 items-center rounded-control bg-accent-cta px-5 py-3 text-sm font-semibold text-white hover:bg-accent-cta-hover"
              >
                Demander un audit
              </Link>
            </div>

            <div className="rounded-card border border-border bg-card p-6">
              <h3 className="text-sm font-semibold text-text-primary">Une question sur le produit ?</h3>
              <p className="mt-1 text-sm text-text-secondary">
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
