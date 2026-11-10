import { useState } from 'react'
import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

const FAQ_ITEMS: { question: string; answer: ReactNode }[] = [
  {
    question: 'Nouankany, c’est quoi exactement ?',
    answer:
      'Pas un simple compteur : une plateforme qui vous dit quel appareil dérive, quand agir et combien vous pouvez économiser, chiffre estimé à l’appui.',
  },
  {
    question: 'Qui peut utiliser Nouankany aujourd’hui ?',
    answer: (
      <>
        Les PME et Industries, après un audit et un pilote de 6 à 9 mois. Les ménages, en accès anticipé, gratuit pendant
        la phase pilote.{' '}
        <Link to="/comment-ca-marche" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
          Voir le détail du fonctionnement
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Faut-il acheter du matériel pour commencer ?',
    answer:
      // S-09 et A1-16 (audits du 2026-11-10) : Nouankany ne finance pas le matériel, son prix est donné avant commande.
      'Non. Le logiciel démarre à partir de vos factures CIE, sans capteur. Les capteurs utiles se choisissent pendant l’audit ; leur prix est donné ligne par ligne avant toute commande.',
  },
  {
    question: 'Est-ce que je choisis moi-même quels équipements instrumenter ?',
    answer:
      'On choisit ensemble pendant l’audit : les équipements qui consomment le plus ou qui ne doivent pas tomber en panne.',
  },
  {
    question: 'Comment les économies sont-elles mesurées ?',
    answer:
      'On compare, en kWh, vos factures CIE validées à la ligne de base relevée pendant l’audit. Les gains affichés avant la facture sont des estimations, et sont marqués comme telles.',
  },
  {
    question: 'Que se passe-t-il à la fin du pilote de 6 à 9 mois ?',
    answer:
      'Si les résultats sont bons, on étend à d’autres équipements ou sites. Sinon, rien n’est imposé.',
  },
  {
    // D6 : « personne ne fait du suivi continu » était faux ; on nomme les acteurs et on dit ce qui diffère.
    question: 'D’autres font-ils déjà cela ?',
    answer:
      'Oui, en partie : Smart Energy, EDF et Dalkia, Conergies et ARIC, les frigoristes locaux, ou ColdHubs et Koolboks pour le froid solaire. Nouankany assemble trois choses : la lecture de votre facture CIE, les kWh appareil par appareil, et le partage des économies, en indiquant l’origine de chaque chiffre.',
  },
  {
    question: 'Les données affichées sur le dashboard sont-elles réelles ?',
    answer:
      'Chaque chiffre indique son origine : mesuré, estimé ou synthétique. Jamais une valeur inventée.',
  },
  {
    question: 'Quand la formule Ménage sera-t-elle disponible ?',
    answer: (
      <>
        Elle l&rsquo;est déjà, en accès anticipé : la formule Découverte est gratuite, et Essentiel et Optimum le sont
        aussi pendant la phase pilote.{' '}
        <Link to="/login?mode=signup&type=menage" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
          Créer un compte
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
      <div className="mx-auto grid max-w-[75rem] gap-10 px-6 lg:grid-cols-[4fr_8fr] lg:gap-[4.5rem]">
        <div>
          <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.025em] text-text-primary">
            Vos questions
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
