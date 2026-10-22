import { LegalDocument } from '@/pages/legal/LegalDocument'
import type { LegalSection } from '@/pages/legal/LegalDocument'

export const PRIVACY_UPDATED = '21 octobre 2026'

/** Politique de confidentialité, par type de compte (mise à jour le 2026-10-21). */
export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    scope: 'Tous les comptes',
    blocks: ['Nouankany, Abidjan, Côte d’Ivoire, est responsable du traitement des données décrites ci-dessous. Contact : contact@nouankany.com.'],
  },
  {
    id: 'donnees',
    title: 'Données collectées',
    scope: 'Tous les comptes',
    blocks: [
      {
        list: [
          'Identité et connexion : nom, adresse email, mot de passe (enregistré sous forme hachée, jamais en clair).',
          'Consommation : appareils déclarés, relevés des boîtiers et capteurs lorsqu’ils sont installés, factures CIE saisies ou téléversées (photo ou PDF), numéro de compteur ou de contrat CIE.',
          'Facturation Nouankany : formule ou contrat, paiements enregistrés (montant, date, mode de paiement, référence), relevés et parts des économies.',
          'Commande de matériel : type de matériel, quantité, coordonnées de contact et indications de livraison que vous saisissez.',
          'Journal du compte : date de connexion et actions effectuées, y compris celles d’un technicien ou d’un administrateur.',
          'Formulaires publics : demande d’audit, message de contact, liste d’attente (email et, si vous le donnez, téléphone).',
        ],
      },
    ],
  },
  {
    id: 'donnees-menage',
    title: 'Données propres aux ménages',
    scope: 'Ménage',
    blocks: [
      'Logements (nom, type de compteur, calibre du disjoncteur) et, pour un compteur à carte, recharges (montant, kWh, date, photo du reçu si vous la joignez) et relevés de compteur que vous saisissez. Ils servent à estimer votre crédit restant et le prix réel de votre kWh.',
    ],
  },
  {
    id: 'donnees-pro',
    title: 'Données propres aux PME et industries',
    scope: 'PME et Industrie',
    blocks: [
      'Sites, machines, ligne de base relevée pendant l’audit, conditions du contrat, membres de l’équipe et accès accordés à un technicien. Les relevés du compteur général du site servent, si une facture CIE tarde, à calculer une part provisoire des économies, corrigée à l’arrivée de la facture.',
    ],
  },
  {
    id: 'finalites',
    title: 'Pourquoi nous les utilisons',
    scope: 'Tous les comptes',
    blocks: [
      {
        list: [
          'Fournir le service : suivi de consommation, prévisions, alertes, conseils, assistant, rapports.',
          'Vérifier vos factures CIE avant de les valider (titulaire, numéro de compteur, chiffres) et calculer vos économies.',
          'Gérer votre formule ou votre contrat : périodes d’abonnement, parts des économies, rappels de paiement, suspension et rétablissement des services.',
          'Vous prévenir : notifications dans la plateforme et emails (alertes, justificatifs attendus, rappels).',
          'Traiter vos commandes de matériel, vos demandes d’audit et vos messages.',
          'Assurer la sécurité de la plateforme et garder la trace des actions sur chaque compte.',
        ],
      },
    ],
  },
  {
    id: 'base-legale',
    title: 'Base légale',
    scope: 'Tous les comptes',
    blocks: [
      'L’exécution du contrat (fourniture du service à un compte créé, facturation), votre consentement (formulaires publics, avis par email), nos obligations légales (conservation des pièces comptables) et notre intérêt légitime à assurer la sécurité et le bon fonctionnement du service.',
    ],
  },
  {
    id: 'factures-ia',
    title: 'Factures et intelligence artificielle',
    scope: 'Tous les comptes',
    blocks: [
      'Pour lire une facture, une copie de la photo est envoyée à un service d’intelligence artificielle après masquage de la zone qui porte votre nom et votre adresse. Le numéro de compteur est lu sur notre serveur et n’est jamais envoyé à ce service.',
      'La photo d’origine, sans modification, est gardée pour que l’équipe Nouankany puisse la vérifier avant de valider la facture.',
    ],
  },
  {
    id: 'conservation',
    title: 'Durée de conservation',
    scope: 'Tous les comptes',
    blocks: [
      {
        list: [
          'Compte actif : vos données sont gardées tant que le compte existe.',
          'Compte supprimé : votre nom, votre adresse, vos photos, les noms de vos sites et appareils, vos conversations et vos notes sont effacés de la plateforme.',
          'Identité de l’abonné et pièces comptables (relevés, parts, paiements) : 10 ans après la fin du service, dans une archive protégée, comme la loi l’impose.',
          'Historique des actions du compte : même durée, lisible par un administrateur seulement, en cas de litige ou de demande légale ; chaque consultation est tracée.',
          'Demandes d’audit, liste d’attente, messages de contact et journaux techniques : 3 ans.',
          'Sauvegardes de la base : 90 jours au plus.',
        ],
      },
    ],
  },
  {
    id: 'sans-lien',
    title: 'Données techniques gardées sans lien avec vous',
    scope: 'Tous les comptes',
    blocks: [
      'Quand un compte est supprimé, les caractéristiques des appareils, les relevés et les consommations sont gardés sous un identifiant neuf, sans table de correspondance avec l’ancien compte. Ils ne permettent plus de remonter à vous, servent à améliorer les prévisions et n’apparaissent jamais dans l’espace d’un autre client. La localisation est ramenée à la commune ou au pays.',
    ],
  },
  {
    id: 'destinataires',
    title: 'Destinataires et hébergement',
    scope: 'Tous les comptes',
    blocks: [
      'Vos données sont accessibles à l’équipe Nouankany pour le service, aux membres de votre équipe (PME et Industrie) et, pendant la durée que vous fixez, au technicien à qui vous ouvrez votre compte. Elles ne sont ni vendues ni transmises à des fins publicitaires.',
      'La plateforme s’appuie sur des prestataires techniques situés hors de Côte d’Ivoire : hébergement de l’application et de la base de données, calcul des prévisions, envoi des emails, et un service d’intelligence artificielle pour la lecture des factures, l’analyse des photos et l’assistant. Ils ne reçoivent que les données nécessaires à leur tâche.',
    ],
  },
  {
    id: 'stockage-local',
    title: 'Stockage local et cookies',
    scope: 'Tous les comptes',
    blocks: [
      'La plateforme garde votre session et vos préférences d’affichage dans le stockage local de votre navigateur, propre à votre appareil. Aucun cookie tiers de suivi publicitaire n’est utilisé.',
    ],
  },
  {
    id: 'droits',
    title: 'Vos droits',
    scope: 'Tous les comptes',
    blocks: [
      'Conformément à la loi ivoirienne n° 2013-450 relative à la protection des données à caractère personnel, vous disposez d’un droit d’accès, de rectification, d’effacement et d’opposition. Depuis Paramètres, vous pouvez exporter vos données, supprimer votre compte et couper les avis par email. Pour toute autre demande, écrivez à contact@nouankany.com. Vous pouvez aussi saisir l’ARTCI, l’autorité de protection des données.',
    ],
  },
  {
    id: 'securite',
    title: 'Sécurité',
    scope: 'Tous les comptes',
    blocks: [
      'Les mots de passe sont hachés, les échanges avec la plateforme sont chiffrés (HTTPS), chaque boîtier dispose d’une clé qui lui est propre, et l’accès aux données d’un compte est réservé à ce compte, à son équipe et aux personnes qu’il autorise.',
    ],
  },
]

export function PrivacyPage() {
  return (
    <LegalDocument
      kicker="Légal"
      title="Politique de confidentialité"
      intro="Les données que Nouankany collecte, pourquoi, combien de temps elles sont gardées et vos droits : pour tous les comptes, puis ce qui est propre aux ménages, aux PME et aux industries."
      updated={PRIVACY_UPDATED}
      sections={PRIVACY_SECTIONS}
    />
  )
}
