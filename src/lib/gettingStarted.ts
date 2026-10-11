import type { Profile } from '@/types/domain'

/** Ce que la plateforme sait déjà du compte : sert à cocher une étape sans rien demander. */
export interface StartFacts {
  sites: number
  appareils: number
  factures: number
  boitiers: number
  membres: number
  emailConfirme: boolean
}

export type StartCheck = keyof StartFacts

export interface StartStep {
  id: string
  title: string
  /** Ce que fait l'action, en une ou deux phrases simples. */
  what: string
  to: string
  cta: string
  /** Étape cochée d'après les données du compte ; sans `check`, elle l'est quand la page a été ouverte. */
  check?: StartCheck
}

const CONFIRM_EMAIL: StartStep = {
  id: 'email',
  title: 'Confirmer votre adresse',
  what: 'Un lien vous a été envoyé par email. Il protège votre compte et permet de retrouver votre mot de passe.',
  to: '/app/parametres',
  cta: 'Ouvrir les paramètres',
  check: 'emailConfirme',
}

export const STEPS_BY_PROFILE: Record<Profile, StartStep[]> = {
  menage: [
    CONFIRM_EMAIL,
    {
      id: 'appareils',
      title: 'Ajouter vos appareils',
      what: 'Indiquez vos gros appareils : climatiseur, réfrigérateur, chauffe-eau. Une photo de l’appareil suffit pour le reconnaître.',
      to: '/app/equipements',
      cta: 'Ajouter un appareil',
      check: 'appareils',
    },
    {
      id: 'facture',
      title: 'Envoyer une facture CIE',
      what: 'Prenez votre facture en photo. La plateforme lit le montant et les kWh, et s’en sert pour prévoir la suivante.',
      to: '/app/factures',
      cta: 'Envoyer une facture',
      check: 'factures',
    },
    {
      id: 'prediction',
      title: 'Voir votre consommation prévue',
      what: 'La plateforme estime ce que vous allez consommer dans les prochaines heures, et ce que cela coûte.',
      to: '/app/prediction',
      cta: 'Voir la prévision',
    },
    {
      id: 'conseils',
      title: 'Lire vos conseils',
      what: 'Des gestes simples, appareil par appareil, pour payer moins sans changer vos habitudes.',
      to: '/app/conseils',
      cta: 'Lire les conseils',
    },
    {
      id: 'abonnement',
      title: 'Choisir votre formule',
      what: 'Comparez les formules et ce que chacune débloque. Vous pouvez rester sur la formule gratuite.',
      to: '/app/facturation',
      cta: 'Voir les formules',
    },
  ],
  pme: [
    CONFIRM_EMAIL,
    {
      id: 'site',
      title: 'Créer votre premier site',
      what: 'Un site est un lieu : une boutique, un atelier, un entrepôt. Vos appareils et vos factures y sont rattachés.',
      to: '/app/parametres',
      cta: 'Créer un site',
      check: 'sites',
    },
    {
      id: 'appareils',
      title: 'Déclarer vos équipements',
      what: 'Listez ce qui consomme le plus : froid, climatisation, fours, pompes. La plateforme calcule ce que chacun vous coûte.',
      to: '/app/equipements',
      cta: 'Ajouter un équipement',
      check: 'appareils',
    },
    {
      id: 'facture',
      title: 'Envoyer vos factures CIE',
      what: 'Une photo par facture. Elles servent de point de départ pour mesurer vos économies, après validation par notre équipe.',
      to: '/app/factures',
      cta: 'Envoyer une facture',
      check: 'factures',
    },
    {
      id: 'alertes',
      title: 'Regarder vos alertes et recommandations',
      what: 'La plateforme signale un appareil qui consomme trop ou chauffe, et propose une action chiffrée en FCFA.',
      to: '/app/recommandations',
      cta: 'Voir les recommandations',
    },
    {
      id: 'plan',
      title: 'Construire votre plan d’action',
      what: 'Gardez les actions que vous voulez mener ce mois-ci et suivez le gain attendu de chacune.',
      to: '/app/plan-action',
      cta: 'Ouvrir le plan d’action',
    },
    {
      id: 'boitier',
      title: 'Demander un boîtier de mesure',
      what: 'Le boîtier mesure vos appareils en continu. Sans lui, les relevés affichés sont des simulations.',
      to: '/app/boitier',
      cta: 'Voir le boîtier',
      check: 'boitiers',
    },
    {
      id: 'equipe',
      title: 'Inviter votre équipe',
      what: 'Donnez un accès à un responsable ou un technicien. Chacun a son propre mot de passe.',
      to: '/app/parametres',
      cta: 'Ajouter un membre',
      check: 'membres',
    },
  ],
  industrie: [
    CONFIRM_EMAIL,
    {
      id: 'site',
      title: 'Créer votre site industriel',
      what: 'Un site est une usine ou un atelier. Les machines, les factures et les relevés y sont rattachés.',
      to: '/app/parametres',
      cta: 'Créer un site',
      check: 'sites',
    },
    {
      id: 'machines',
      title: 'Déclarer vos machines prioritaires',
      what: 'Commencez par les trois à cinq machines qui pèsent le plus sur la facture : compresseurs, groupes froids, moteurs.',
      to: '/app/machines',
      cta: 'Ajouter une machine',
      check: 'appareils',
    },
    {
      id: 'facture',
      title: 'Envoyer vos factures CIE',
      what: 'Elles fixent la consommation de référence. C’est à partir d’elle que les économies sont mesurées et partagées.',
      to: '/app/factures',
      cta: 'Envoyer une facture',
      check: 'factures',
    },
    {
      id: 'seuils',
      title: 'Régler vos seuils d’alerte',
      what: 'Fixez la température et la vibration à ne pas dépasser. Une machine qui les franchit déclenche une alerte.',
      to: '/app/parametres',
      cta: 'Régler les seuils',
    },
    {
      id: 'alertes',
      title: 'Suivre les alertes et la prévision',
      what: 'Chaque machine est comparée à son fonctionnement normal. Un écart vous est signalé avec l’action conseillée.',
      to: '/app/alertes',
      cta: 'Voir les alertes',
    },
    {
      id: 'plan',
      title: 'Piloter votre plan d’action',
      what: 'Retenez les actions du mois, suivez leur avancement et le gain attendu.',
      to: '/app/plan-action',
      cta: 'Ouvrir le plan d’action',
    },
    {
      id: 'contrat',
      title: 'Consulter votre contrat et vos relevés',
      what: 'Votre contrat fixe la part des économies partagée. Chaque mois, un relevé détaille le calcul.',
      to: '/app/facturation',
      cta: 'Voir la facturation',
    },
    {
      id: 'equipe',
      title: 'Inviter votre équipe',
      what: 'Donnez un accès au responsable maintenance ou production. Chaque action est tracée dans l’audit.',
      to: '/app/parametres',
      cta: 'Ajouter un membre',
      check: 'membres',
    },
  ],
  admin: [
    {
      id: 'sante',
      title: 'Vérifier la santé de la plateforme',
      what: 'Base de données, temps de réponse et disponibilité : à regarder en premier chaque jour.',
      to: '/app/admin/sante',
      cta: 'Ouvrir la santé',
    },
    {
      id: 'factures',
      title: 'Valider les factures en attente',
      what: 'Une facture envoyée par un client ne compte dans un relevé qu’après votre validation, photo à l’appui.',
      to: '/app/admin/facturation',
      cta: 'Voir les factures',
    },
    {
      id: 'utilisateurs',
      title: 'Suivre les comptes',
      what: 'Suspendre un compte, réinitialiser un mot de passe, consulter les machines d’un client.',
      to: '/app/admin/utilisateurs',
      cta: 'Voir les utilisateurs',
    },
    {
      id: 'leads',
      title: 'Traiter les demandes d’audit',
      what: 'Les entreprises qui demandent un audit attendent un rappel : c’est l’entrée de chaque contrat.',
      to: '/app/admin/leads',
      cta: 'Voir les demandes',
    },
    {
      id: 'modeles',
      title: 'Suivre les modèles et la collecte',
      what: 'Qualité des prévisions et nombre de mesures réelles reçues des boîtiers.',
      to: '/app/admin/modeles',
      cta: 'Ouvrir les modèles',
    },
  ],
}

export interface StartProgress {
  steps: (StartStep & { done: boolean })[]
  doneCount: number
  total: number
  /** Première étape non faite, ou null quand tout est fait. */
  next: StartStep | null
}

const THRESHOLD: Partial<Record<StartCheck, number>> = { membres: 2 } // le titulaire compte pour un membre

export function startProgress(profile: Profile, facts: Partial<StartFacts>, visited: readonly string[]): StartProgress {
  const steps = STEPS_BY_PROFILE[profile].map((step) => {
    let done = visited.includes(step.id)
    if (step.check) {
      const value = facts[step.check]
      done = typeof value === 'boolean' ? value : (value ?? 0) >= (THRESHOLD[step.check] ?? 1)
    }
    return { ...step, done }
  })
  const doneCount = steps.filter((s) => s.done).length
  return { steps, doneCount, total: steps.length, next: steps.find((s) => !s.done) ?? null }
}
