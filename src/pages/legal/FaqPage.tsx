import type { ReactNode } from 'react'
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
      'Le choix est fait conjointement lors de l’audit initial, selon le poids énergétique et la criticité de chaque équipement — pas une instrumentation de l’ensemble du site dès le départ.',
  },
  {
    question: 'Comment les économies sont-elles mesurées ?',
    answer:
      'Une ligne de base est établie lors de l’audit initial. Pendant le pilote, la consommation réelle est comparée à cette ligne de base pour objectiver les économies — pas une estimation a priori.',
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
        <Link to="/comment-ca-marche" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
          Inscrivez-vous pour être informé(e) à l&rsquo;ouverture
        </Link>
        .
      </>
    ),
  },
]

export function FaqPage() {
  return (
    <div id="main-content" className="mx-auto max-w-[760px] px-6 py-16">
      <Link to="/" className="text-sm font-semibold text-accent-cta hover:text-accent-cta-hover">
        ← Retour à l&rsquo;accueil
      </Link>
      <h1 className="mt-4 text-h2-secondary font-bold text-text-primary">Questions fréquentes</h1>

      <div className="mt-6 flex flex-col gap-4">
        {FAQ_ITEMS.map((item) => (
          <div key={item.question} className="rounded-card border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-text-primary">{item.question}</h2>
            <p className="mt-2 text-sm text-text-secondary">{item.answer}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-text-secondary">
        Une autre question ?{' '}
        <Link to="/contact" className="font-semibold text-accent-cta hover:text-accent-cta-hover">
          Contactez-nous
        </Link>
        .
      </p>
    </div>
  )
}
