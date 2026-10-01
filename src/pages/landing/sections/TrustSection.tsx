import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import type { Provenance } from '@/types/domain'

const ROWS: { value: Provenance; definition: string }[] = [
  { value: 'mesure', definition: 'Donnée issue d’un capteur installé sur votre site.' },
  {
    value: 'estime',
    definition: 'Calculé à partir de votre facture CIE et de votre déclaration d’équipements.',
  },
  {
    value: 'synthetique',
    definition: 'Modèle entraîné sur un jeu de données de référence, en attendant vos données réelles.',
  },
]

export function TrustSection() {
  return (
    <section id="confiance" className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] items-start gap-12 px-6 lg:grid-cols-[6fr_5fr] lg:gap-[72px]">
        <div>
          <h2 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
            Une donnée est mesurée, estimée, ou synthétique. Jamais inventée.
          </h2>
          <p className="mt-6 text-[1.25rem] leading-snug text-text-primary">
            Chaque chiffre affiché sur votre dashboard porte l&rsquo;origine de son calcul.
          </p>
          <p className="mt-4 text-text-secondary">
            Pas de promesse d&rsquo;IA gonflée. Si un capteur n&rsquo;est pas encore installé chez vous, on vous le
            dit, et on chiffre quand même votre potentiel d&rsquo;économie sur des hypothèses transparentes.
          </p>
        </div>
        <dl className="border-b border-border lg:mt-2">
          {ROWS.map((row) => (
            <div key={row.value} className="border-t border-border py-6">
              <dt>
                <ProvenanceBadge value={row.value} />
              </dt>
              <dd className="mt-3 text-text-secondary">{row.definition}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
