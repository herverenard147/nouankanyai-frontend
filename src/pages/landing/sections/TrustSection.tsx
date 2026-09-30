import { Calculator, Cpu, Gauge } from 'lucide-react'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import type { Provenance } from '@/types/domain'

const ROWS: { value: Provenance; icon: typeof Gauge; definition: string }[] = [
  { value: 'mesure', icon: Gauge, definition: 'Donnée issue d’un capteur installé sur votre site.' },
  {
    value: 'estime',
    icon: Calculator,
    definition: 'Calculé à partir de votre facture CIE et de votre déclaration d’équipements.',
  },
  {
    value: 'synthetique',
    icon: Cpu,
    definition: 'Modèle entraîné sur un jeu de données de référence, en attendant vos données réelles.',
  },
]

export function TrustSection() {
  return (
    <section id="confiance" className="border-y border-border bg-bg-elevated py-16">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
        <div className="flex flex-col gap-3.5">
          <p className="font-mono text-label font-semibold uppercase tracking-wide text-text-secondary">
            Notre engagement
          </p>
          <h2 className="text-h2-secondary font-bold text-text-primary">
            Une donnée est mesurée, estimée, ou synthétique. Jamais inventée.
          </h2>
          <p className="text-lede text-text-primary">
            Chaque chiffre affiché sur votre dashboard porte l&rsquo;origine de son calcul.
          </p>
          <p className="text-small-body text-text-secondary">
            Pas de promesse d&rsquo;IA gonflée. Si un capteur n&rsquo;est pas encore installé chez vous, on vous le
            dit, et on chiffre quand même votre potentiel d&rsquo;économie sur des hypothèses transparentes.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {ROWS.map((row) => {
            const Icon = row.icon
            return (
              <div key={row.value} className="flex items-center gap-3.5 rounded-card border border-border bg-card p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-bg-elevated">
                  <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <ProvenanceBadge value={row.value} className="w-fit" />
                  <p className="text-sm text-text-secondary">{row.definition}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
