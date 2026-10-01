const STEPS = [
  {
    title: 'Audit initial',
    body: 'Analyse de vos factures CIE et de vos équipements pour identifier les postes de consommation à fort potentiel d’économie.',
  },
  {
    title: 'Pilote 6 à 9 mois',
    body: 'Instrumentation ciblée des équipements prioritaires. Vos économies réelles sont chiffrées, mesures à l’appui.',
  },
  {
    title: 'Généralisation',
    body: 'Extension du suivi à l’ensemble du site si les résultats du pilote sont concluants.',
  },
]

export function ProofSection() {
  return (
    <section id="methode" className="py-20 lg:py-28">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2 className="max-w-[20ch] text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
          Une méthode en 3 étapes, pas un abonnement figé
        </h2>
        <ol className="relative mt-12 grid gap-10 lg:mt-16 lg:grid-cols-3 lg:gap-12">
          <span aria-hidden="true" className="absolute left-0 right-0 top-[9px] hidden h-0.5 bg-text-primary lg:block" />
          {STEPS.map((step) => (
            <li key={step.title} className="relative">
              <span aria-hidden="true" className="block h-5 w-5 border-2 border-text-primary bg-accent" />
              <h3 className="mt-6 text-[1.625rem] font-bold leading-tight tracking-[-0.015em] text-text-primary">
                {step.title}
              </h3>
              <p className="mt-2.5 text-text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
