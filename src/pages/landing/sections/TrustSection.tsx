import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import type { Provenance } from '@/types/domain'

const ROWS: { value: Provenance; definition: string }[] = [
  { value: 'mesure', definition: 'Donnée issue d’un capteur installé sur votre site.' },
  { value: 'estime', definition: 'Calculé à partir de votre facture CIE et de votre déclaration d’équipements.' },
  {
    value: 'synthetique',
    definition: 'Modèle entraîné sur un jeu de données de référence, en attendant vos données réelles.',
  },
]

export function TrustSection() {
  return (
    <section id="confiance" className="border-y border-border bg-bg-elevated py-16">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Notre engagement
          </p>
          <h2 className="text-h2-secondary font-bold text-text-primary">
            Une donnée est mesurée, estimée, ou synthétique. Jamais inventée.
          </h2>
          <p className="text-small-body text-text-secondary">
            Chaque chiffre affiché sur votre dashboard porte l&rsquo;origine de son calcul. Pas de promesse
            d&rsquo;IA gonflée. Si un capteur n&rsquo;est pas encore installé chez vous, on vous le dit, et on chiffre
            quand même votre potentiel d&rsquo;économie sur des hypothèses transparentes.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ROWS.map((row) => (
            <div key={row.value} className="flex items-center gap-3 rounded-control border border-border bg-card px-3.5 py-3">
              <ProvenanceBadge value={row.value} />
              <p className="text-sm text-text-secondary">{row.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
