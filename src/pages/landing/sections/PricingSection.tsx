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
    ctas: [{ label: 'Être informé à l’ouverture', href: '/comment-ca-marche', primary: true }],
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

export function PricingSection() {
  return (
    <section id="formules" className="bg-dark-bg py-20 text-white lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="max-w-[20ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em]">
          Un modèle qui se rentabilise avant de vous coûter
        </h2>
        <p className="mt-4 max-w-[62ch] text-dark-text">
          Pour les entreprises, le logiciel démarre sans capteur à acheter. L&rsquo;instrumentation IoT ciblée
          s&rsquo;ajoute progressivement sur vos équipements prioritaires, à mesure que le pilote avance.
        </p>

        <div className="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-3 lg:gap-0">
          {TIERS.map((tier) => (
            <div key={tier.name} className="flex flex-col lg:px-9 lg:first:pl-0 lg:last:pr-0">
              <div
                className={`flex h-full flex-col border-t-4 pt-6 ${
                  tier.featured ? 'border-accent' : 'border-dark-field-border'
                }`}
              >
                <p className={`font-mono text-[0.8rem] font-semibold ${tier.featured ? 'text-[#f59e6b]' : 'text-dark-text'}`}>
                  {tier.badge}
                </p>
                <h3 className="mt-2 text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">{tier.name}</h3>
                <p className="mt-1 text-dark-text">{tier.audience}</p>
                <p className="mt-4 font-semibold">{tier.priceLabel}</p>
                <ul className="mt-5 flex flex-col gap-3 text-[0.95rem] text-dark-text">
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3 pt-7">
                  {tier.ctas.map((cta) => (
                    <Link
                      key={cta.label}
                      to={cta.href}
                      className={
                        cta.primary
                          ? 'focus-ring inline-flex min-h-12 items-center bg-accent px-6 py-3.5 text-base font-semibold text-text-primary hover:brightness-110'
                          : 'focus-ring text-[0.95rem] font-semibold underline underline-offset-4 hover:opacity-80'
                      }
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
