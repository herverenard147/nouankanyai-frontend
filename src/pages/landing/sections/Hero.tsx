import { Link } from 'react-router-dom'

import { ProvenanceBadge } from '@/components/provenance/ProvenanceBadge'
import { TariffBar } from '@/components/tariff/TariffBar'

export function Hero() {
  return (
    <section className="border-b border-border py-16">
      <div className="mx-auto grid max-w-[1120px] gap-14 px-6 [grid-template-columns:repeat(auto-fit,minmax(min(320px,100%),1fr))] lg:items-center">
        <div className="flex flex-col gap-5">
          <h1 className="max-w-[12ch] text-h1 font-bold text-text-primary">
            Prenez en photo votre facture CIE. On s&rsquo;occupe du reste.
          </h1>
          <p className="max-w-[46ch] text-lede text-text-secondary">
            Nouankany lit votre facture, prédit votre prochaine consommation et vous dit précisément quoi éteindre
            ou décaler pour payer moins. Pas de capteur à acheter pour commencer, pas d&rsquo;engagement.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <Link
              to="/login?mode=signup"
              className="focus-ring inline-flex min-h-11 items-center rounded-control bg-accent-cta px-5 py-3.5 text-sm font-semibold text-white hover:bg-accent-cta-hover"
            >
              Essayer gratuitement
            </Link>
            <a
              href="#profils"
              className="focus-ring inline-flex min-h-11 items-center rounded-control border border-border px-5 py-3.5 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
            >
              Voir comment ça marche
            </a>
          </div>
          <p className="text-[0.85rem] text-text-secondary">
            <span className="font-semibold text-text-primary">Zéro investissement de départ.</span> Application
            logicielle dès aujourd&rsquo;hui. Capteurs ajoutés au besoin, jamais imposés.
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
