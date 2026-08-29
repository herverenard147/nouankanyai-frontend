import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { TextField } from '@/components/ui/TextField'
import { Button } from '@/components/ui/Button'
import { useJoinWaitlist } from '@/hooks/queries/useWaitlist'
import { Footer } from '@/pages/landing/sections/Footer'
import { NavBar } from '@/pages/landing/sections/NavBar'

const PHASES = [
  {
    step: '01',
    title: 'Audit et installation ciblée',
    period: 'Mois 1',
    body: 'Diagnostic initial de votre site et mesure de votre ligne de base. Les équipements à instrumenter sont choisis selon leur poids énergétique et leur criticité, pas l’ensemble du site.',
  },
  {
    step: '02',
    title: 'Observation et calibration',
    period: 'Mois 2 à 3',
    body: 'Les modèles s’ajustent sur vos données réelles. Premières alertes et premières recommandations, propres à vos équipements.',
  },
  {
    step: '03',
    title: 'Exploitation terrain',
    period: 'Mois 4 à 6',
    body: 'Amélioration continue des modèles. Les économies générées sur vos équipements prioritaires sont mesurées, pas estimées a priori.',
  },
  {
    step: '04',
    title: 'Consolidation et généralisation',
    period: 'Mois 7 à 9, si retenus',
    body: 'Les résultats mesurés sont consolidés. Si le pilote est concluant, le déploiement s’étend à d’autres équipements ou sites.',
  },
]

const REVENUE_LINES = [
  {
    title: 'Audit de référence',
    body: 'Ponctuel, avant ou au démarrage du contrat.',
  },
  {
    title: 'Part sur les économies constatées',
    body: 'Un pourcentage des économies réellement mesurées, pas un forfait figé.',
  },
  {
    title: 'Abonnement SaaS',
    body: 'Accès mensuel à la plateforme : dashboards, alertes, recommandations et reporting.',
  },
]

function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const mutation = useJoinWaitlist()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate({ email, telephone: telephone.trim() || undefined })
  }

  if (mutation.isSuccess) {
    return (
      <p className="mt-5 text-sm font-semibold text-confirm">
        Merci, vous êtes inscrit(e). Nous vous contacterons par email{telephone ? ' ou SMS' : ''} à
        l&rsquo;ouverture.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <TextField
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="vous@exemple.com"
        className="sm:w-64"
      />
      <TextField
        label="Téléphone (optionnel, pour un SMS)"
        type="tel"
        value={telephone}
        onChange={(e) => setTelephone(e.target.value)}
        placeholder="+225 01 02 03 04"
        className="sm:w-64"
      />
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Envoi…' : 'Être informé à l’ouverture'}
      </Button>
      {mutation.isError && (
        <p className="w-full text-sm text-alert">Échec de l&rsquo;inscription, réessayez.</p>
      )}
    </form>
  )
}

export function HowItWorksPage() {
  return (
    <>
      <NavBar />
      <main id="main-content">
        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-[760px] px-6">
            <p className="font-mono text-[0.78rem] font-semibold uppercase tracking-wide text-text-secondary">
              Comment ça marche
            </p>
            <h1 className="mt-2 text-h1 font-bold text-text-primary">Deux parcours, un seul produit</h1>
            <p className="mt-4 text-lede text-text-secondary">
              PME et Industrie sont en phase pilote active dès aujourd&rsquo;hui : audit, installation ciblée, puis
              6 à 9 mois de mesure avant généralisation. La formule Ménage arrive dans un second temps, une fois ce
              pilote industriel consolidé.
            </p>
          </div>
        </section>

        <section className="border-b border-border py-16">
          <div className="mx-auto max-w-[1120px] px-6">
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <span className="w-fit rounded-pill bg-accent-cta px-3 py-1 text-xs font-semibold text-white">
                Segment prioritaire
              </span>
              <h2 className="text-h2-section font-bold text-text-primary">Pour les PME et Industries</h2>
            </div>

            <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr))]">
              {PHASES.map((phase) => (
                <div key={phase.step} className="rounded-card border border-border bg-card p-5">
                  <span className="font-mono text-lg font-semibold text-text-tertiary">{phase.step}</span>
                  <h3 className="mt-1 text-sm font-semibold text-text-primary">{phase.title}</h3>
                  <p className="font-mono text-mono-axis text-text-tertiary">{phase.period}</p>
                  <p className="mt-2 text-sm text-text-secondary">{phase.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-text-primary">Comment la relation commerciale est structurée</h3>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
                {REVENUE_LINES.map((line) => (
                  <div key={line.title} className="rounded-card border border-border bg-card p-5">
                    <h4 className="text-sm font-semibold text-text-primary">{line.title}</h4>
                    <p className="mt-1 text-sm text-text-secondary">{line.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3.5">
              <Link
                to="/demander-un-audit?type=industrie"
                className="focus-ring inline-flex min-h-11 items-center rounded-control bg-accent-cta px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-cta-hover"
              >
                Demander un audit Industrie
              </Link>
              <Link
                to="/demander-un-audit?type=pme"
                className="focus-ring inline-flex min-h-11 items-center rounded-control border border-border px-5 py-3.5 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
              >
                Demander un audit PME
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-[1120px] px-6">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="w-fit rounded-pill bg-bg-elevated px-3 py-1 text-xs font-semibold text-text-secondary">
                Bientôt disponible
              </span>
              <h2 className="text-h2-section font-bold text-text-primary">Pour les Ménages</h2>
            </div>
            <div className="max-w-[640px] rounded-card border border-border bg-card p-6">
              <p className="text-[0.98rem] text-text-secondary">
                Vous prenez en photo votre facture CIE. Nouankany prédit votre prochaine consommation et vous dit
                précisément quoi éteindre ou décaler pour payer moins. Sans capteur pour commencer : ce parcours
                repose sur votre facture et votre déclaration d&rsquo;équipements, pas sur une installation IoT.
              </p>
              <p className="mt-3 text-[0.98rem] text-text-secondary">
                Ce segment ouvre après le pilote PME/Industrie, une fois la plateforme consolidée sur des cas
                industriels réels.
              </p>
              <WaitlistForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
