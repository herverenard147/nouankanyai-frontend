import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useCreateAuditRequest } from '@/hooks/queries/useAuditRequests'
import type { LeadSector } from '@/types/backend'

const SECTOR_LABELS: Record<LeadSector, string> = {
  pme: 'PME',
  industrie: 'Industrie',
}

export function AuditRequestPage() {
  const [searchParams] = useSearchParams()
  const typeParam = searchParams.get('type')
  const [secteur, setSecteur] = useState<LeadSector>(typeParam === 'industrie' ? 'industrie' : 'pme')

  const [entreprise, setEntreprise] = useState('')
  const [contactNom, setContactNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [message, setMessage] = useState('')
  const [entrepriseError, setEntrepriseError] = useState<string | null>(null)
  const [contactNomError, setContactNomError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const mutation = useCreateAuditRequest()
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const nextEntrepriseError = entreprise.trim() ? null : "Le nom de l'entreprise est requis."
    const nextContactNomError = contactNom.trim() ? null : 'Le nom du contact est requis.'
    const nextEmailError = EMAIL_RE.test(email) ? null : 'Entrez une adresse email valide.'
    setEntrepriseError(nextEntrepriseError)
    setContactNomError(nextContactNomError)
    setEmailError(nextEmailError)
    if (nextEntrepriseError || nextContactNomError || nextEmailError) return

    mutation.mutate({
      entreprise: entreprise.trim(),
      contact_nom: contactNom.trim(),
      email: email.trim(),
      telephone: telephone.trim() || undefined,
      secteur,
      message: message.trim() || undefined,
    })
  }

  if (mutation.isSuccess) {
    return (
      <div id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
        <div className="w-full max-w-md text-center">
          <img src="/logo.png" alt="Nouankany" className="mx-auto h-10 w-10 object-contain" />
          <h1 className="mt-4 text-h2-secondary font-bold text-text-primary">Demande envoyée</h1>
          <p className="mt-3 text-text-secondary">
            Merci. Notre équipe revient vers vous sous 48h ouvrées pour organiser l&rsquo;audit initial et poser les
            bases du pilote.
          </p>
          <Link to="/" className="mt-6 inline-flex font-semibold text-accent-cta hover:text-accent-cta-hover">
            Retour à l&rsquo;accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div id="main-content" className="flex min-h-screen items-center justify-center bg-bg px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <img src="/logo.png" alt="Nouankany" className="h-10 w-10 object-contain" />
          <h1 className="text-h2-secondary font-bold text-text-primary">Demander un audit</h1>
          <p className="text-sm text-text-secondary">
            Diagnostic initial et ligne de base de votre consommation, avant tout engagement. Notre équipe vous
            recontacte pour organiser la suite.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Votre segment</span>
            <div className="flex gap-2">
              {(['pme', 'industrie'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSecteur(option)}
                  className={`focus-ring min-w-0 flex-1 rounded-control border px-3 py-2 text-sm font-medium ${
                    secteur === option ? 'border-text-primary bg-text-primary text-white' : 'border-border text-text-secondary'
                  }`}
                >
                  {SECTOR_LABELS[option]}
                </button>
              ))}
            </div>
          </div>

          <TextField
            label="Entreprise"
            value={entreprise}
            onChange={(e) => setEntreprise(e.target.value)}
            error={entrepriseError ?? undefined}
            required
          />
          <TextField
            label="Nom du contact"
            value={contactNom}
            onChange={(e) => setContactNom(e.target.value)}
            error={contactNomError ?? undefined}
            required
          />
          <TextField
            label="Email professionnel"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError ?? undefined}
            required
          />
          <TextField label="Téléphone (optionnel)" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="audit-message" className="text-sm font-medium text-text-primary">
              Contexte (optionnel)
            </label>
            <textarea
              id="audit-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Ce que vous cherchez à résoudre, vos équipements prioritaires…"
              className="focus-ring rounded-control border border-border bg-card px-3.5 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-alert" role="alert">
              Échec de l&rsquo;envoi. Réessayez dans un instant.
            </p>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Envoi…' : 'Envoyer la demande'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link to="/" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
            Retour à la landing
          </Link>
        </p>
      </div>
    </div>
  )
}
