import { Link } from 'react-router-dom'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { TariffBar } from '@/components/tariff/TariffBar'

export function Hero() {
  return (
    <section className="border-b border-border py-16">
      <div className="mx-auto grid max-w-[1120px] gap-14 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))] lg:items-center">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-[16ch] text-h1 font-bold text-text-primary">
            Pilotez la consommation électrique de votre site, avant qu&rsquo;elle ne pilote vos coûts.
          </h1>
          <p className="max-w-[46ch] text-lede text-text-secondary">
            Nouankany détecte les dérives, priorise les équipements à surveiller et chiffre vos économies
            potentielles, mesures à l&rsquo;appui. Un audit initial, un pilote de 6 à 9 mois sur vos équipements
            prioritaires, une généralisation si les résultats sont concluants.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              to="/demander-un-audit"
              className="focus-ring inline-flex min-h-11 items-center rounded-control bg-accent-cta px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-cta-hover"
            >
              Demander un audit
            </Link>
            <Link
              to="/comment-ca-marche"
              className="focus-ring inline-flex min-h-11 items-center rounded-control border border-border px-5 py-3.5 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
            >
              Voir comment ça marche
            </Link>
          </div>
          <p className="text-[0.85rem] text-text-secondary">
            <span className="font-semibold text-text-primary">Ménages :</span> la formule arrive dans les
            prochains mois.{' '}
            <Link to="/comment-ca-marche" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
              Être informé à l&rsquo;ouverture
            </Link>
          </p>
        </div>

        <div className="rounded-card border border-border bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-mono text-[0.85rem] font-semibold uppercase tracking-wide text-text-secondary">
              Grille tarifaire CIE
            </p>
            <p className="font-mono tabular-nums text-text-primary">
              <span className="text-2xl font-semibold">87</span>{' '}
              <span className="text-sm text-text-secondary">FCFA/kWh</span>
            </p>
          </div>
          <TariffBar />
          <div className="mt-2 flex justify-between text-xs text-text-secondary">
            <span>Nuit, tarif bas</span>
            <span>Écart pointe/creuses : ×2</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
            <span className="text-[0.82rem] text-text-secondary">Prédiction hebdomadaire</span>
            <ProvenanceBadge value="synthetique" />
          </div>
        </div>
      </div>
    </section>
  )
}
