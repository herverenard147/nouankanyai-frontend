const REPERES = [
  { label: 'Zone d’intervention', value: 'Abidjan, Côte d’Ivoire' },
  { label: 'Secteurs pilotes', value: 'Industrie, distribution, hôtellerie, santé' },
  { label: 'Approche', value: 'Audit → pilote 6-9 mois → généralisation' },
]

export function AboutSection() {
  return (
    <section id="apropos" className="bg-bg-elevated py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-6 lg:grid-cols-[4fr_7fr] lg:gap-[72px]">
        <div>
          <h3 className="text-xl font-bold tracking-[-0.01em] text-text-primary">Nouankany en bref</h3>
          <dl className="mt-5 border-b border-border">
            {REPERES.map((repere) => (
              <div key={repere.label} className="border-t border-border py-4">
                <dt className="font-mono text-[0.8rem] text-text-secondary">{repere.label}</dt>
                <dd className="mt-1 font-semibold text-text-primary">{repere.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <h2 className="max-w-[18ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
            Une entreprise ivoirienne dédiée à la performance énergétique.
          </h2>
          <p className="mt-6 text-[1.25rem] leading-snug text-text-primary">
            Nouankany conçoit une plateforme d&rsquo;efficacité énergétique qui combine intelligence artificielle et
            instrumentation IoT ciblée.
          </p>
          <p className="mt-4 text-text-secondary">
            Nous aidons les entreprises fortement consommatrices d&rsquo;électricité, industries, grande distribution,
            hôtellerie et santé, à comprendre leurs usages, anticiper les dérives et réduire leur consommation
            évitable. L&rsquo;équipe est basée à Abidjan.
          </p>
          <p className="mt-4 text-text-secondary">
            Notre approche : rester agiles, rester spécialisés en IA prédictive et en pilotage énergétique, et
            prouver la valeur sur le terrain, mesures à l&rsquo;appui, avant toute généralisation.
          </p>
        </div>
      </div>
    </section>
  )
}
