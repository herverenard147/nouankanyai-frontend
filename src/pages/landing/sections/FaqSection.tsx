import { useState } from 'react'
import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQ_ITEMS: { question: string; answer: ReactNode }[] = [
  {
    question: 'Nouankany, c’est quoi exactement ?',
    answer:
      'Une plateforme de pilotage énergétique qui combine intelligence artificielle, analyse de consommation et, pour les PME et Industries, une instrumentation IoT ciblée sur les équipements prioritaires. Pas un simple compteur connecté : l’objectif est de transformer les données électriques en décisions concrètes (quel équipement dérive, quand agir, quelle économie attendre).',
  },
  {
    question: 'Qui peut utiliser Nouankany aujourd’hui ?',
    answer: (
      <>
        Les PME et Industries sont le segment prioritaire dès aujourd&rsquo;hui, via un contrat pilote de 6 à 9
        mois. La formule Ménage arrive dans un second temps.{' '}
        <Link to="/comment-ca-marche" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
          Voir le détail du fonctionnement
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Faut-il acheter du matériel pour commencer ?',
    answer:
      'Le modèle est en tiers-investisseur : l’installation initiale (capteurs ciblés) est financée par Nouankany, puis récupérée via une part sur les économies réellement mesurées et un abonnement SaaS mensuel. Un audit de référence, lui, est facturé au démarrage du contrat.',
  },
  {
    question: 'Est-ce que je choisis moi-même quels équipements instrumenter ?',
    answer:
      'Le choix est fait conjointement lors de l’audit initial, selon le poids énergétique et la criticité de chaque équipement, pas une instrumentation de l’ensemble du site dès le départ.',
  },
  {
    question: 'Comment les économies sont-elles mesurées ?',
    answer:
      'Une ligne de base est établie lors de l’audit initial. Pendant le pilote, la consommation réelle est comparée à cette ligne de base pour objectiver les économies, pas une estimation a priori.',
  },
  {
    question: 'Que se passe-t-il à la fin du pilote de 6 à 9 mois ?',
    answer:
      'Les résultats mesurés sont consolidés. Si le pilote est concluant, le déploiement s’étend à d’autres équipements ou sites (généralisation). Rien n’est automatique : la généralisation dépend des résultats réellement observés.',
  },
  {
    question: 'Les données affichées sur le dashboard sont-elles réelles ?',
    answer:
      'Chaque donnée porte l’origine de son calcul : mesurée (capteur installé), estimée (facture et déclaration d’équipements), ou synthétique (modèle entraîné sur données de référence, en attendant vos données réelles). Jamais une valeur inventée.',
  },
  {
    question: 'Quand la formule Ménage sera-t-elle disponible ?',
    answer: (
      <>
        D&rsquo;ici 12 à 24 mois, une fois le pilote PME/Industrie consolidé.{' '}
        <Link to="/#contact" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
          Inscrivez-vous pour être informé(e) à l&rsquo;ouverture
        </Link>
        .
      </>
    ),
  },
]

export function FaqSection() {
  // Une seule réponse ouverte à la fois ; la première l'est au chargement.
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 lg:grid-cols-[4fr_8fr] lg:gap-[72px]">
        <div>
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
            Avant de nous écrire, la réponse est peut-être ici
          </h2>
          <p className="mt-6 text-text-secondary">
            Une autre question ?{' '}
            <Link to="/#contact" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
              Contactez-nous
            </Link>
            .
          </p>
        </div>

        <div className="border-b border-border">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            const panelId = `faq-panel-${index}`
            const Icon = isOpen ? Minus : Plus
            return (
              <div key={item.question} className="border-t border-border">
                <h3>
                  <button
                    type="button"
                    id={`faq-button-${index}`}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="focus-ring flex w-full items-center justify-between gap-6 py-6 text-left text-xl font-bold leading-snug tracking-[-0.01em] text-text-primary hover:text-accent-cta"
                  >
                    {item.question}
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </button>
                </h3>
                <div
                  id={panelId}
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'invisible grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 text-text-secondary">{item.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
