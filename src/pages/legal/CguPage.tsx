import { LegalDocument } from '@/pages/legal/LegalDocument'
import type { LegalSection } from '@/pages/legal/LegalDocument'

export const CGU_UPDATED = '21 octobre 2026'

/** Conditions générales d'utilisation, par type de compte (mises à jour le 2026-10-21). */
export const CGU_SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: 'Objet et acceptation',
    scope: 'Tous les comptes',
    blocks: [
      'Les présentes Conditions Générales d’Utilisation (CGU) régissent l’accès et l’usage de la plateforme Nouankany, éditée par Nouankany (Abidjan, Côte d’Ivoire), accessible par le site et l’application web.',
      'En créant un compte ou en utilisant le service, vous acceptez ces conditions. Les sections marquées d’un type de compte (Ménage, PME, Industrie) ne s’appliquent qu’à ce type de compte.',
    ],
  },
  {
    id: 'service',
    title: 'Le service',
    scope: 'Tous les comptes',
    blocks: [
      'Nouankany aide à comprendre et à réduire sa consommation d’électricité : suivi de la consommation, prévisions, alertes, conseils et recommandations, lecture des factures CIE, assistant, et, selon le compte, boîtiers et capteurs de mesure.',
      'Chaque valeur affichée indique sa provenance : mesurée par un boîtier, lue sur une facture, saisie, ou estimée. Les prévisions et recommandations sont une aide à la décision, pas une garantie de résultat.',
    ],
  },
  {
    id: 'comptes',
    title: 'Comptes, équipe et accès technicien',
    scope: 'Tous les comptes',
    blocks: [
      'La création d’un compte demande une adresse email valide et un mot de passe d’au moins 8 caractères. Vous êtes responsable de la confidentialité de vos identifiants et de l’activité de votre compte.',
      'Un compte PME ou Industrie peut inviter jusqu’à 4 membres, qui voient les données du compte ; seul le titulaire ajoute ou retire des membres.',
      'Le titulaire peut ouvrir son compte à un technicien Nouankany pour 1 à 30 jours, afin d’installer ou de régler des sources de mesure, et retirer cet accès à tout moment. Le technicien ne modifie jamais les factures ni les paramètres du compte ; chacune de ses actions est inscrite au journal du compte, à son nom.',
    ],
  },
  {
    id: 'menage-formules',
    title: 'Formules et abonnement',
    scope: 'Ménage',
    blocks: [
      'Trois formules sont proposées :',
      {
        list: [
          'Découverte, gratuite : jusqu’à 3 appareils et 1 logement, suivi de la consommation, factures, compteur à carte, rapport mensuel et alertes de sécurité.',
          'Essentiel, 2 900 FCFA pour 30 jours : jusqu’à 10 appareils, prévision de 2 appareils, facture prévue, seuils d’alerte personnalisés et alertes par email.',
          'Optimum, 7 900 FCFA pour 30 jours : appareils illimités, prévision de 4 appareils, jusqu’à 3 logements, assistant, conseils et anomalies « À vérifier ».',
        ],
      },
      'Un essai de 14 jours, à l’inscription, ouvre toutes les fonctions. Vous changez de formule vous-même, depuis la page Abonnement ; une formule plus petite est refusée tant que vos appareils ou logements dépassent ses limites, et rien n’est supprimé à votre place.',
      'Une formule payante se paie d’avance, pour 30 jours à partir du jour du paiement. Payée avant la fin de la période en cours, la nouvelle période suit l’actuelle, sans perdre de jour. Payée après, elle commence le jour du paiement : les jours sans abonnement ne sont jamais facturés. Sans paiement, le compte repasse en Découverte jusqu’au règlement ; vos données et votre historique restent intacts.',
      'Un rappel s’affiche dans vos notifications et vous est envoyé par email 5 jours avant la fin de la période, puis le jour de la fin.',
    ],
  },
  {
    id: 'menage-compteur-carte',
    title: 'Logements et compteur à carte',
    scope: 'Ménage',
    blocks: [
      'Pour chaque logement, vous indiquez le type de compteur (à facture ou à carte) et le calibre du disjoncteur, qui sert à comparer vos pics de puissance.',
      'Pour un compteur à carte, la plateforme estime le crédit restant à partir de vos recharges et de votre consommation mesurée ou estimée. Cette estimation est indicative : la seule valeur qui fait foi est celle de votre compteur. Une notification vous prévient quand le crédit estimé descend sous 3 jours, et un email sous 2 jours.',
    ],
  },
  {
    id: 'pme-sans-contrat',
    title: 'Formule gratuite sans contrat',
    scope: 'PME',
    blocks: [
      'Une PME sans contrat dispose de la formule Découverte Pro, gratuite : jusqu’à 5 appareils, suivi de la consommation, prévisions, alertes de seuil, assistant et rapport mensuel.',
    ],
  },
  {
    id: 'contrat',
    title: 'Contrat, abonnement et part des économies',
    scope: 'PME et Industrie',
    blocks: [
      'Le service sous contrat commence par un audit de référence, qui mesure la consommation de départ du site (ligne de base), puis un pilote de 6 à 9 mois sur les équipements prioritaires. Le prix de l’audit est fixé avec chaque client, selon son site ; les frais d’audit sont dus à la signature du contrat.',
      'L’abonnement (50 000 FCFA par défaut, ou le montant du contrat) se paie d’avance, pour 30 jours à partir du jour du paiement, selon la même règle que pour les ménages : payé avant la fin, la nouvelle période suit l’actuelle ; payé après, elle commence le jour du paiement, et les jours sans abonnement ne sont jamais facturés.',
      'La part de Nouankany est de 40 % des économies constatées par défaut, entre 30 et 50 % selon le contrat. Les économies se mesurent en kWh, sur les factures CIE validées, par rapport à la ligne de base : une hausse des tarifs ne crée jamais d’économie, et un mois sans économie ne donne lieu à aucune part.',
      'Une part est établie pour chaque facture CIE validée, sur les mois qu’elle couvre (un ou deux, comme la CIE). Elle est à régler dans les 15 jours. Le détail du calcul de chaque part est visible sur la page Facturation.',
    ],
  },
  {
    id: 'factures',
    title: 'Factures CIE et justificatif',
    scope: 'Tous les comptes',
    blocks: [
      'Une facture CIE n’entre dans les calculs (économies, parts, prévisions de facture) qu’une fois validée par l’équipe Nouankany, justificatif à l’appui. Une facture validée n’est plus modifiable.',
      'Pour une facture saisie à la main, vous disposez de 7 jours pour joindre sa photo ou son PDF. Si l’équipe vous demande un justificatif (photo illisible, facture incomplète), le même délai de 7 jours s’applique, avec ce qu’il faut joindre. Dans les deux cas, un rappel s’affiche dans vos notifications et vous est envoyé par email 2 jours avant la limite. Sans justificatif à la date limite, la facture est refusée automatiquement.',
      'Tout refus est motivé : le motif s’affiche sous la facture, dans vos notifications et par email. Vous pouvez saisir la facture de nouveau avec un justificatif lisible.',
      'Le numéro de compteur ou de contrat CIE est enregistré sur votre compte (saisi par vous ou lu sur votre première facture) puis verrouillé ; un changement se demande avec justificatif. Une facture est refusée à l’enregistrement si elle porte un autre numéro, si un reçu de paiement est présenté à la place de la facture, si les chiffres saisis diffèrent de ceux lus sur le document, ou si la même facture existe déjà sur un autre compte.',
    ],
  },
  {
    id: 'facture-retard',
    title: 'Facture CIE en retard et part provisoire',
    scope: 'PME et Industrie',
    blocks: [
      'La facture suivante est attendue 30 jours après la fin de sa période. Passé ce délai, un rappel s’affiche dans vos notifications et vous est envoyé par email.',
      'Si le compteur général de votre site est mesuré par un boîtier, une part provisoire est calculée sur ses relevés. À l’arrivée de la vraie facture, elle est remplacée si elle n’a pas été payée ; si elle a déjà été payée, son montant est déduit de la vraie part, et un éventuel trop-perçu devient un avoir, déduit de la part suivante.',
      'Sans compteur général mesuré, les services sont suspendus 15 jours après le rappel, jusqu’à l’envoi de la facture, même avant sa validation.',
    ],
  },
  {
    id: 'paiement',
    title: 'Paiement, retard et suspension',
    scope: 'Tous les comptes',
    blocks: [
      'Le paiement en ligne n’est pas encore ouvert : vous réglez auprès de l’équipe Nouankany (espèces, Wave, Orange Money, MTN Money, Moov Money, virement), qui enregistre le paiement à sa date réelle. Tant que la facturation réelle n’est pas ouverte, les relevés affichés sont indicatifs et ne sont pas des factures.',
      'Une part des économies impayée à son échéance s’ajoute à la part suivante, comme sur une facture CIE. Les rappels de paiement s’affichent dans vos notifications et vous sont envoyés par email avant l’échéance et le jour même.',
      'Les services sont suspendus dans les cas suivants : abonnement PME ou Industrie arrivé à son terme sans renouvellement ; deux parts des économies impayées de suite, ou des frais d’audit impayés, 15 jours après leur échéance ; facture CIE jamais envoyée, dans le cas décrit plus haut.',
      'Une suspension ne coupe que les services : analyses, assistant, alertes, prévisions et boîtiers. Vous gardez toujours l’accès à votre compte, à votre historique, à vos factures, à vos relevés, à votre abonnement et au paiement. Les services reviennent dès le paiement enregistré ou la facture envoyée.',
    ],
  },
  {
    id: 'materiel',
    title: 'Matériel, boîtiers et coupure d’un appareil',
    scope: 'Tous les comptes',
    blocks: [
      'Le boîtier qui parle, le capteur d’un appareil et la passerelle de mesure se commandent depuis la plateforme. Le prix est détaillé ligne par ligne avant la commande (composants, transport et douane, montage, livraison, pose) et reste celui de la demande, même si les tarifs changent ensuite. Les compteurs Modbus d’une passerelle ne sont pas compris : ils se chiffrent selon le tableau électrique.',
      'Seul le client peut couper un appareil à distance, s’il l’a déclaré éteignable et qu’un capteur avec relais y est posé ; le boîtier demande toujours une confirmation, et un ordre sans accusé de réception du capteur est affiché comme échoué. L’équipe Nouankany ne coupe ni ne relance jamais un appareil à votre place ; elle peut seulement révoquer un boîtier (il cesse alors d’envoyer des mesures), par exemple en cas de perte ou de compromission.',
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications et emails',
    scope: 'Tous les comptes',
    blocks: [
      'La plateforme vous informe par la cloche des notifications et par email : alertes sur vos appareils, factures validées ou refusées, justificatifs attendus, relevés et rappels de paiement, fin d’abonnement, crédit de compteur à carte.',
      'Vous pouvez couper les avis par email dans Paramètres. Les messages qui concernent votre compte ou un paiement (confirmation d’adresse, mot de passe, rappels de paiement, suspension) restent envoyés.',
    ],
  },
  {
    id: 'donnees',
    title: 'Vos contenus et données',
    scope: 'Tous les comptes',
    blocks: [
      'Vous restez propriétaire des données que vous déclarez ou téléversez (factures, appareils, relevés). Vous nous accordez le droit de les traiter pour fournir le service. Le détail figure dans la Politique de confidentialité.',
    ],
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    scope: 'Tous les comptes',
    blocks: [
      'La plateforme, son code, ses modèles et son design restent la propriété de Nouankany. Aucune licence autre que l’accès au service dans le cadre de votre compte ne vous est concédée.',
    ],
  },
  {
    id: 'limites',
    title: 'Niveau de maturité et limites',
    scope: 'Tous les comptes',
    blocks: [
      'Le produit est en développement actif. Les prévisions et recommandations reposent sur des modèles statistiques et, sans mesure sur votre site, sur des données estimées : elles ne garantissent aucun résultat. Les économies d’un pilote sont mesurées sur vos factures, jamais promises à l’avance.',
    ],
  },
  {
    id: 'resiliation',
    title: 'Résiliation',
    scope: 'Tous les comptes',
    blocks: [
      'Vous pouvez supprimer votre compte vous-même, dans Paramètres. Les sommes déjà dues (parts, frais d’audit) restent dues. Nouankany peut suspendre un compte en cas d’usage abusif ou de non-respect des présentes CGU.',
    ],
  },
  {
    id: 'droit',
    title: 'Droit applicable',
    scope: 'Tous les comptes',
    blocks: [
      'Les présentes CGU sont régies par le droit ivoirien. Tout litige relève, à défaut de résolution amiable, des juridictions compétentes de Côte d’Ivoire.',
    ],
  },
]

export function CguPage() {
  return (
    <LegalDocument
      kicker="Légal"
      title="Conditions Générales d’Utilisation"
      intro="Les règles d’usage de Nouankany : ce qui vaut pour tous les comptes, puis ce qui est propre aux ménages, aux PME et aux industries."
      updated={CGU_UPDATED}
      sections={CGU_SECTIONS}
    />
  )
}
