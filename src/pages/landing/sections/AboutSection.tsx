import { Factory, MapPin, Workflow } from 'lucide-react'

const REPERES = [
  { icon: MapPin, label: 'Zone d’intervention', value: 'Abidjan, Côte d’Ivoire' },
  { icon: Factory, label: 'Secteurs pilotes', value: 'Industrie, distribution, hôtellerie, santé' },
  { icon: Workflow, label: 'Approche', value: 'Audit → pilote 6-9 mois → généralisation' },
]

export function AboutSection() {
  return (
    <section id="apropos" className="py-16">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        <div className="flex flex-col gap-5 rounded-card border border-border bg-bg-elevated p-7">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Nouankany en bref
          </p>
          <dl className="flex flex-col gap-5">
            {REPERES.map((repere) => {
              const Icon = repere.icon
              return (
                <div key={repere.label} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-card">
                    <Icon className="h-5 w-5 text-accent-cta" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-xs text-text-secondary">{repere.label}</dt>
                    <dd className="font-heading text-base font-semibold text-text-primary">{repere.value}</dd>
                  </div>
                </div>
              )
            })}
          </dl>
        </div>
        <div className="flex flex-col gap-3.5">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Qui sommes-nous
          </p>
          <h2 className="text-h2-secondary font-bold text-text-primary">
            Une entreprise ivoirienne dédiée à la performance énergétique.
          </h2>
          <p className="text-lede text-text-primary">
            Nouankany conçoit une plateforme d&rsquo;efficacité énergétique qui combine intelligence artificielle et
            instrumentation IoT ciblée.
          </p>
          <p className="text-small-body text-text-secondary">
            Nous aidons les entreprises fortement consommatrices d&rsquo;électricité, industries, grande distribution,
            hôtellerie et santé, à comprendre leurs usages, anticiper les dérives et réduire leur consommation
            évitable. L&rsquo;équipe est basée à Abidjan.
          </p>
          <p className="text-small-body text-text-secondary">
            Notre approche : rester agiles, rester spécialisés en IA prédictive et en pilotage énergétique, et
            prouver la valeur sur le terrain, mesures à l&rsquo;appui, avant toute généralisation.
          </p>
        </div>
      </div>
    </section>
  )
}
