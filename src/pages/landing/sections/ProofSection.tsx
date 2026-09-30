const STEPS = [
  {
    n: '01',
    title: 'Audit initial',
    body: 'Analyse de vos factures CIE et de vos équipements pour identifier les postes de consommation à fort potentiel d’économie.',
  },
  {
    n: '02',
    title: 'Pilote 6 à 9 mois',
    body: 'Instrumentation ciblée des équipements prioritaires. Vos économies réelles sont chiffrées, mesures à l’appui.',
  },
  {
    n: '03',
    title: 'Généralisation',
    body: 'Extension du suivi à l’ensemble du site si les résultats du pilote sont concluants.',
  },
]

export function ProofSection() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-[1120px] px-6">
        <div className="mb-8 flex max-w-[60ch] flex-col gap-2">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Comment ça marche
          </p>
          <h2 className="text-h2-section font-bold text-text-primary">Une méthode en 3 étapes, pas un abonnement figé</h2>
        </div>
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))]">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-2 rounded-card border border-border bg-card p-6">
              <span className="font-heading text-h2-secondary font-bold text-text-tertiary">{step.n}</span>
              <h3 className="text-section-title font-semibold text-text-primary">{step.title}</h3>
              <p className="text-sm text-text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
