import { PhotoPlaceholder } from '@/components/ui/PhotoPlaceholder'

export function AboutSection() {
  return (
    <section id="apropos" className="py-16">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        <PhotoPlaceholder caption="Équipe Nouankany au travail, Abidjan" />
        <div className="flex flex-col gap-3">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Qui sommes-nous
          </p>
          <h2 className="text-h2-secondary font-bold text-text-primary">
            Une entreprise ivoirienne dédiée à la performance énergétique.
          </h2>
          <p className="text-small-body text-text-secondary">
            Nouankany conçoit une plateforme d&rsquo;efficacité énergétique qui combine intelligence artificielle et
            instrumentation IoT ciblée. Nous aidons les entreprises fortement consommatrices d&rsquo;électricité,
            industries, grande distribution, hôtellerie et santé, à comprendre leurs usages, anticiper les dérives
            et réduire leur consommation évitable. L&rsquo;équipe est basée à Abidjan.
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
