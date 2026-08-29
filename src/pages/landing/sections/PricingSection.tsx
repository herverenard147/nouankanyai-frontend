import { Link } from 'react-router-dom'

interface TierCta {
  label: string
  href: string
  primary: boolean
}

interface Tier {
  name: string
  audience: string
  priceLabel: string
  badge: string
  features: string[]
  /**
   * Ménage : un seul CTA, self-service direct vers l'inscription (déjà un
   * essai gratuit). PME/Industrie : deux CTA — "Demander un audit" reste le
   * parcours commercial réel (vente consultative, voir Business Plan §9),
   * "Essayer gratuitement" ouvre en plus un compte self-service marqué
   * essai (`is_trial`) pour explorer le produit avec des données simulées
   * avant de s'engager dans un audit.
   */
  ctas: TierCta[]
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Découverte',
    audience: 'Ménages, Côte d’Ivoire',
    priceLabel: 'Gratuit pour commencer',
    badge: 'Bientôt disponible',
    features: [
      'Suivi de consommation à partir de votre facture CIE',
      'Prédiction hebdomadaire et alerte de seuil',
      'Conseils génériques classés par impact',
      'Formule complète à venir, une fois ce segment activé',
    ],
    ctas: [{ label: 'Essayer gratuitement', href: '/login?mode=signup&type=menage&trial=1', primary: true }],
  },
  {
    name: 'Pilote PME',
    audience: 'Commerces et PME multi-équipements',
    priceLabel: 'Structure définie lors de l’audit',
    badge: 'Segment prioritaire',
    featured: true,
    features: [
      'Audit initial et ligne de base de votre consommation',
      'Plateforme complète : dashboards, alertes, recommandations',
      'Part sur les économies réellement mesurées, pas un forfait figé',
      'Contrat pilote de 6 à 9 mois avant généralisation',
    ],
    ctas: [
      { label: 'Demander un audit', href: '/demander-un-audit?type=pme', primary: true },
      { label: 'Essayer gratuitement', href: '/login?mode=signup&type=pme&trial=1', primary: false },
    ],
  },
  {
    name: 'Pilote Industrie',
    audience: 'Industries, grande distribution, hôtellerie, santé',
    priceLabel: 'Structure définie lors de l’audit',
    badge: 'Segment prioritaire',
    featured: true,
    features: [
      'Audit et instrumentation IoT ciblée sur vos équipements prioritaires',
      'Détection d’anomalies et plan d’action chiffré',
      'Part sur les économies réellement mesurées, pas un forfait figé',
      'Contrat pilote de 6 à 9 mois avant généralisation',
    ],
    ctas: [
      { label: 'Demander un audit', href: '/demander-un-audit?type=industrie', primary: true },
      { label: 'Essayer gratuitement', href: '/login?mode=signup&type=industrie&trial=1', primary: false },
    ],
  },
]

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Audit',
    body: 'Diagnostic initial et ligne de base de votre consommation, avant tout engagement contractuel.',
  },
  {
    step: '02',
    title: 'Pilote, 6 à 9 mois',
    body: 'Installation ciblée sur vos équipements prioritaires, calibration des modèles sur vos données réelles, premières alertes et recommandations.',
  },
  {
    step: '03',
    title: 'Généralisation',
    body: 'Résultats mesurés et consolidés, proposition de déploiement élargi ou de renouvellement.',
  },
]

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="8" r="8" fill={color} />
      <path d="M4.5 8.2 6.8 10.5 11.5 5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PricingSection() {
  return (
    <section id="formules" className="py-16">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-10 flex flex-col gap-2">
          <p className="font-mono text-[0.78rem] font-semibold uppercase tracking-wide text-text-secondary">Formules</p>
          <h2 className="text-h2-section font-bold text-text-primary">
            Un modèle qui se rentabilise avant de vous coûter
          </h2>
          <p className="max-w-[60ch] text-[1.02rem] text-text-secondary">
            Pour les entreprises, le logiciel démarre sans capteur à acheter. L&rsquo;instrumentation IoT ciblée
            s&rsquo;ajoute progressivement sur vos équipements prioritaires, à mesure que le pilote avance.
          </p>
        </div>

        <div className="grid items-start gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col gap-4 rounded-pricing border bg-card p-6 ${
                tier.featured ? 'border-accent shadow-pricing-featured lg:-translate-y-1.5' : 'border-border'
              }`}
            >
              <span
                className={`w-fit rounded-pill px-3 py-1 text-xs font-semibold ${
                  tier.featured ? 'bg-accent-cta text-white' : 'bg-bg-elevated text-text-secondary'
                }`}
              >
                {tier.badge}
              </span>
              <div>
                <h3 className="text-h3-card font-semibold text-text-primary">{tier.name}</h3>
                <p className="text-sm text-text-secondary">{tier.audience}</p>
              </div>
              <p className="text-sm font-semibold text-text-primary">{tier.priceLabel}</p>
              <ul className="flex flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckIcon color={tier.featured ? 'var(--color-accent)' : 'var(--color-confirm)'} />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                {tier.ctas.map((cta) => (
                  <Link
                    key={cta.label}
                    to={cta.href}
                    className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-control px-5 py-3 text-sm font-semibold ${
                      cta.primary
                        ? 'bg-accent-cta text-white hover:bg-accent-cta-hover'
                        : 'border border-border text-text-primary hover:bg-bg-elevated'
                    }`}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-text-primary">Comment fonctionne un pilote PME ou Industrie</h3>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr))]">
            {PROCESS_STEPS.map((item) => (
              <div key={item.step} className="rounded-card border border-border bg-card p-5">
                <span className="font-mono text-lg font-semibold text-text-tertiary">{item.step}</span>
                <h4 className="mt-1 text-sm font-semibold text-text-primary">{item.title}</h4>
                <p className="mt-1 text-sm text-text-secondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
