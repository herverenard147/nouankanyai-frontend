import type { Profile } from '@/types/domain'

/**
 * Documentation de chaque acteur (demande du propriétaire, 2026-10-16) : ménage, PME, industrie, technicien,
 * administrateur. Chacun lit la sienne : un technicien n'a pas la documentation d'un client. Les messages d'erreur sont
 * dans `erreurs.ts` et s'ajoutent à la fin de chaque guide, filtrés pour le profil.
 * Tout ce qui est écrit ici décrit le comportement réel de la plateforme (valeurs reprises du backend) : à mettre à
 * jour en même temps que lui.
 */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'code'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'download'; href: string; label: string }

export interface Section {
  id: string
  title: string
  blocks: Block[]
}

export interface Guide {
  title: string
  intro: string
  sections: Section[]
}

// ----------------------------------------------------------------------------- briques communes aux clients

const ALERTES: Section = {
  id: 'alertes',
  title: 'Alertes : quand et comment vous êtes prévenu',
  blocks: [
    { kind: 'p', text: 'Chaque mesure reçue est aussitôt comparée aux seuils de l’appareil. Il y a trois niveaux :' },
    {
      kind: 'table',
      head: ['Niveau', 'Ce que ça veut dire', 'Ce qui se passe'],
      rows: [
        ['Alerte (rouge)', 'Un seuil est dépassé maintenant.', 'L’alerte apparaît dans les alertes et un email part au titulaire du compte.'],
        ['À vérifier (orange)', 'Une mesure s’écarte de ses habitudes ou s’approche du seuil, sans le dépasser.', 'Visible sur la plateforme et le boîtier ; aucun email.'],
        ['Conseil', 'La consommation dépasse ce qui était prévu.', 'Un conseil d’économie, jamais une alerte.'],
      ],
    },
    {
      kind: 'list',
      items: [
        'Un seul email par dépassement : tant que la valeur reste au-dessus du seuil, vous n’en recevez pas d’autre.',
        'Les alertes tirées de l’analyse de vos données (factures, relevés importés) sont, elles aussi, vérifiées en continu : elles s’ouvrent même si vous ne vous connectez pas, avec le même email.',
        'Si vous êtes connecté quand une alerte s’ouvre, un bandeau « Nouvelle alerte » s’affiche en haut de l’écran, avec un lien vers la page Alertes.',
        'Un technicien Nouankany à qui vous avez ouvert l’accès voit vos alertes et peut documenter celles qu’il a traitées ; sa réponse porte la mention « par un technicien Nouankany ».',
        'L’alerte se ferme d’elle-même quand la valeur redescend sous 95 % du seuil ; un nouveau dépassement en rouvre une.',
        'Un appareil éteint ne déclenche pas d’alerte.',
        'Des mesures envoyées en retard (après une coupure d’internet) ne déclenchent rien si elles sont plus anciennes que la dernière mesure reçue.',
        'Pour ne plus recevoir ces emails : Paramètres, rubrique Emails, décochez « Recevoir les avis par email ». Les alertes restent visibles sur la plateforme.',
      ],
    },
  ],
}

const ACCES_TECHNICIEN_CLIENT: Section = {
  id: 'acces-technicien',
  title: 'Faire intervenir un technicien Nouankany',
  blocks: [
    { kind: 'p', text: 'Pour brancher une passerelle ou régler vos sources de mesures, une personne de Nouankany peut avoir besoin d’entrer dans votre compte. C’est vous qui décidez.' },
    {
      kind: 'steps',
      items: [
        'Ouvrez « Accès technicien » (page Sources de mesures, ou Paramètres).',
        'Choisissez la durée : de 1 à 30 jours. Ajoutez une précision si vous voulez (« pose de la passerelle de l’atelier »).',
        'Cliquez sur « Autoriser ». Le technicien voit alors votre compte dans sa liste d’interventions.',
        'Quand le travail est fini, cliquez sur « Retirer l’accès », ou laissez la durée expirer.',
      ],
    },
    {
      kind: 'table',
      head: ['Le technicien peut', 'Le technicien ne peut pas'],
      rows: [
        ['Créer et régler vos boîtiers, passerelles et sources', 'Voir vos factures, votre abonnement ou vos paiements'],
        ['Ajouter les compteurs, relier les noms de votre logiciel, régler vos fichiers', 'Modifier votre profil, votre équipe ou vos paramètres'],
        ['Voir vos sites et vos appareils, pour faire ces liens', 'Utiliser l’assistant ou vos données de consommation'],
      ],
    },
    { kind: 'p', text: 'Chacune de ses actions est inscrite dans votre Journal sous son nom, suivi de « (technicien Nouankany) ». Seul le titulaire du compte peut ouvrir ou retirer cet accès, pas un membre de l’équipe.' },
  ],
}

const SOURCES_CLIENT: Section = {
  id: 'sources',
  title: 'Comment vos mesures arrivent sur la plateforme',
  blocks: [
    { kind: 'p', text: 'Page « Sources de mesures », bouton « Ajouter une source » : la plateforme vous demande comment vos mesures peuvent nous arriver. Six cas :' },
    {
      kind: 'table',
      head: ['Votre situation', 'La source à choisir', 'Qui la met en place'],
      rows: [
        ['Vous avez des compteurs ou rien du tout, et pas de logiciel', 'Passerelle de mesure : un petit boîtier muet dans le tableau électrique, qui lit les compteurs', 'Un technicien Nouankany, sur place'],
        ['Votre logiciel (supervision, gestion d’énergie, GTB) sait envoyer ses données', 'Logiciel du client : il envoie avec une clé', 'Votre informaticien ou intégrateur, avec le technicien'],
        ['Votre logiciel sait seulement exporter un fichier (CSV, Excel)', 'Dépôt de fichiers : chaque jour, automatiquement ou à la main', 'Le technicien règle les colonnes une fois'],
        ['Vous voulez un assistant qui parle', 'Boîtier Nouankany (page Boîtier)', 'Vous, avec un code'],
        ['Vous voulez mesurer un appareil précis, ou pouvoir le couper', 'Capteur d’un appareil : un petit module posé sur l’appareil', 'Un technicien, ou vous avec un code'],
        ['Vous n’avez aucun compteur', 'Vos factures CIE (page Factures)', 'Vous'],
      ],
    },
    {
      kind: 'list',
      items: [
        'Toutes les sources arrivent dans les mêmes unités (kW, kWh…) et passent les mêmes contrôles : une valeur absurde ou une erreur d’unité est refusée, jamais mélangée à vos calculs.',
        'Délai : environ une minute pour une passerelle, un capteur ou un logiciel ; un jour pour un dépôt de fichiers (suffisant pour la facture et les économies, pas pour les alertes).',
        'Vos données ne vont que dans un sens : c’est votre site qui envoie. Nouankany ne se connecte jamais à votre réseau.',
      ],
    },
  ],
}

const FICHIERS_CLIENT: Section = {
  id: 'fichiers',
  title: 'Lire l’historique des fichiers reçus',
  blocks: [
    { kind: 'p', text: 'Sur la fiche d’une source « Dépôt de fichiers », chaque fichier reçu a une ligne : date, origine (dépôt automatique ou plateforme), lignes lues, mesures gardées, lignes refusées. Cliquez sur une ligne pour voir pourquoi chaque ligne a été refusée (fiches d’erreur plus bas).' },
    { kind: 'p', text: 'Un fichier « refusé » en entier n’a rien changé à vos données : corrigez la cause, puis redéposez-le. Redéposer un fichier ne crée jamais de doublon.' },
  ],
}

const CAPTEURS_CLIENT: Section = {
  id: 'capteurs',
  title: 'Les capteurs de vos appareils',
  blocks: [
    { kind: 'p', text: 'Un capteur se pose sur un seul appareil. Il mesure sa vraie consommation au lieu de l’estimer, et peut le couper s’il a un relais.' },
    {
      kind: 'steps',
      items: [
        'Ouvrez la fiche de l’appareil (Mes appareils, ou Machines), bloc « Capteur », puis « Ajouter un capteur ». Cochez « relais » s’il doit pouvoir couper, « sonde » pour un réfrigérateur, un congélateur ou un climatiseur.',
        'Le code s’affiche une fois (15 minutes) : saisissez-le sur le capteur, qui se connecte au wifi.',
        'Le capteur envoie une première lecture pour vérifier ses réglages. Ses mesures comptent seulement si cette lecture est plausible.',
      ],
    },
    {
      kind: 'list',
      items: [
        'Coupure d’internet : le capteur garde ses mesures en mémoire et les envoie au retour de la connexion. Rien n’est perdu.',
        'Couper un appareil : c’est toujours vous qui décidez s’il est éteignable (page Mon boîtier). Le boîtier vous demande de confirmer, le capteur coupe, puis confirme qu’il a bien coupé. Sans cette confirmation, l’ordre est marqué échoué, jamais « éteint ».',
        'Sans internet, la coupure à la voix ne passe pas : le boîtier comprend votre demande grâce à la plateforme.',
        'Un appareil n’a qu’un capteur. Pour le changer, révoquez l’ancien sur sa fiche (Sources de mesures).',
      ],
    },
  ],
}

const SEUILS_PRO: Section = {
  id: 'seuils',
  title: 'Les seuils de vos appareils',
  blocks: [
    { kind: 'p', text: 'Chaque appareil a ses propres seuils : son réglage s’il en a un, sinon celui de sa famille, sinon celui du compte (Paramètres).' },
    {
      kind: 'table',
      head: ['Grandeur', 'Seuil par défaut'],
      rows: [
        ['Puissance', '1,2 fois la puissance nominale de l’appareil'],
        ['Température', 'four ou cuisson 300 °C, chauffage 90 °C, froid 8 °C (à l’intérieur), compresseur 110 °C, moteur 90 °C, pompe 80 °C ; sinon celle du compte (60 °C par défaut)'],
        ['Vibration (mm/s)', 'selon la taille de la machine (norme ISO 20816) : jusqu’à 15 kW, orange dès 1,8 et rouge dès 4,5 ; de 15 à 75 kW, 2,8 et 7,1 ; au-delà, 4,5 et 11,2'],
        ['Pression', 'compresseur 10 bar, pompe 8 bar'],
      ],
    },
    { kind: 'note', text: 'Les vibrations se mesurent en mm/s (vitesse efficace), l’unité de la norme et des capteurs du commerce.' },
  ],
}

const COMMENCER_PRO: Section = {
  id: 'commencer',
  title: 'Commencer',
  blocks: [
    {
      kind: 'steps',
      items: [
        'Confirmez votre adresse email (lien reçu à l’inscription).',
        'Créez vos sites (Paramètres, rubrique Sites) : un site par lieu.',
        'Déclarez vos appareils avec leur puissance et leur site.',
        'Choisissez comment vos mesures arrivent (Sources de mesures), ou envoyez vos factures CIE pour commencer.',
        'Ajoutez les personnes de votre équipe (Paramètres, Équipe) : chaque action reste tracée à leur nom.',
      ],
    },
  ],
}

const REFUS_DONNEES: Section = {
  id: 'confidentialite',
  title: 'Si vous ne voulez pas tout partager',
  blocks: [
    {
      kind: 'list',
      items: [
        'Seule l’énergie est utile : ni cadences, ni recettes, ni quantités produites.',
        'Le technicien peut faire envoyer des totaux par quart d’heure plutôt que chaque mesure.',
        'Les noms de vos machines peuvent être remplacés par des codes ; la correspondance reste chez vous.',
        'Avec le dépôt de fichiers, vous relisez ce qui part avant de le déposer.',
      ],
    },
  ],
}


// Contrat d'envoi : le même pour le technicien et pour l'informaticien du client.
const CONTRAT_BLOCKS: Block[] = [
  {
    kind: 'table',
    head: ['Grandeur', 'Champ', 'Unité imposée'],
    rows: [
      ['Appareil', 'machine_code ou external_ref', 'code Nouankany, ou nom relié'],
      ['Heure', 'recorded_at', 'UTC, ISO 8601 (2026-10-16T08:00:00Z)'],
      ['Puissance', 'power_kw', 'kW (obligatoire)'],
      ['Énergie', 'energy_kwh', 'kWh, index cumulé'],
      ['Tension, courant', 'voltage_v, current_a', 'V, A'],
      ['Facteur de puissance', 'power_factor', 'de 0 à 1'],
      ['Température, vibration, pression', 'temperature_c, vibration_mm_s, pressure_bar', '°C, mm/s, bar'],
    ],
  },
  {
    kind: 'code',
    text: [
      '# 1. Jeton (valable 60 minutes)',
      'POST /api/v1/boitier/token   {"device_id": "<identifiant>", "secret": "<clé>"}',
      '# 2. Mesures (500 au plus par envoi, une par minute conseillée, 30 jours de retard au plus)',
      'POST /api/v1/boitier/measurements   Authorization: Bearer <jeton>',
      '{"readings": [{"external_ref": "COMP_01_kW", "recorded_at": "2026-10-16T08:00:00Z", "power_kw": 12.4}]}',
      '# Réponse : {"accepted": 1, "rejected": [], "alerts_opened": 0} ; chaque refus donne son rang et sa raison.',
    ].join('\n'),
  },
]

const CONTRAT_CLIENT: Section = {
  id: 'contrat',
  title: 'Pour votre informaticien : contrat d’envoi',
  blocks: [
    { kind: 'p', text: 'Si votre logiciel envoie lui-même ses mesures, voici ce qu’il doit respecter. L’identifiant et la clé de la source s’affichent une seule fois, à sa création ; « Remplacer la clé » en donne une nouvelle.' },
    ...CONTRAT_BLOCKS,
    { kind: 'note', text: 'Les unités sont imposées : une puissance au-delà de 50 fois celle de l’appareil est refusée (« unité attendue kW (des W ?) »). Convertissez en kW avant l’envoi.' },
  ],
}

// ----------------------------------------------------------------------------- guides

const MENAGE: Guide = {
  title: 'Guide du foyer',
  intro: 'Tout ce qu’il faut pour suivre votre consommation, comprendre votre boîtier et réagir à une alerte.',
  sections: [
    {
      id: 'commencer',
      title: 'Commencer',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Confirmez votre adresse email (lien reçu à l’inscription).',
            'Ajoutez vos appareils (Mes appareils) : climatiseur, réfrigérateur, télévision…',
            'Envoyez une facture CIE en photo ou en PDF (Mes factures) : la plateforme la lit pour vous.',
            'Lisez vos conseils : ce qui vous fera payer moins, appareil par appareil.',
          ],
        },
      ],
    },
    {
      id: 'boitier',
      title: 'Votre boîtier',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Demandez-le depuis « Mon boîtier » (le prix est affiché dans la demande).',
            'À la réception, cliquez sur « Demander un code » : le code s’affiche une seule fois et vaut 15 minutes.',
            'Saisissez-le sur le boîtier. Il apparaît « En ligne » dans la liste.',
          ],
        },
        { kind: 'p', text: 'Vous préférez qu’un technicien Nouankany l’installe ? Ouvrez-lui votre compte pour un jour (voir « Faire intervenir un technicien ») : il crée le boîtier, le connecte et vérifie vos appareils.' },
        {
          kind: 'table',
          head: ['Lumière', 'Ce qu’elle dit'],
          rows: [
            ['Verte', 'Tous vos appareils suivis sont dans leurs seuils.'],
            ['Orange', 'Un appareil s’approche de son seuil.'],
            ['Rouge', 'Un appareil dépasse son seuil : une action est nécessaire.'],
            ['Blanche qui pulse', 'Le boîtier vous écoute.'],
          ],
        },
        { kind: 'p', text: 'Dites « Hey Nouankany, où en sont mes appareils ? ». Pour éteindre un appareil, le boîtier vous demande toujours de confirmer, et seulement pour les appareils que vous avez déclarés éteignables (fiche du boîtier).' },
        { kind: 'p', text: 'Le boîtier apparaît « Hors ligne » quand il ne s’est pas manifesté depuis 90 secondes : vérifiez qu’il est branché et que le wifi fonctionne.' },
      ],
    },
    CAPTEURS_CLIENT,
    ALERTES,
    ACCES_TECHNICIEN_CLIENT,
  ],
}

const PME: Guide = {
  title: 'Guide PME',
  intro: 'Suivre vos sites et vos équipements, brancher vos mesures, être prévenu à temps et piloter vos économies.',
  sections: [COMMENCER_PRO, SOURCES_CLIENT, CAPTEURS_CLIENT, ALERTES, SEUILS_PRO, FICHIERS_CLIENT, CONTRAT_CLIENT, ACCES_TECHNICIEN_CLIENT, REFUS_DONNEES],
}

const INDUSTRIE: Guide = {
  title: 'Guide industrie',
  intro: 'Suivre vos machines, brancher vos compteurs ou votre supervision, être prévenu à temps et suivre votre plan d’action.',
  sections: [
    COMMENCER_PRO,
    SOURCES_CLIENT,
    CAPTEURS_CLIENT,
    {
      id: 'passerelle',
      title: 'La passerelle de mesure',
      blocks: [
        { kind: 'p', text: 'Muette (ni micro, ni haut-parleur), elle se pose dans le tableau électrique et lit vos compteurs en Modbus (câble RS485 ou réseau). Elle peut envoyer par sa propre carte 4G : rien ne passe par votre réseau.' },
        {
          kind: 'table',
          head: ['État d’un compteur', 'Ce que ça veut dire'],
          rows: [
            ['Lecture d’essai en attente', 'La passerelle va lire ce compteur à sa prochaine minute pour vérifier les réglages.'],
            ['En service', 'L’essai est plausible : ses mesures arrivent chaque minute.'],
            ['À vérifier', 'L’essai a montré une valeur impossible (unité, câblage) : il n’est pas lu tant que le technicien ne l’a pas corrigé. La raison est écrite sur la ligne.'],
          ],
        },
      ],
    },
    ALERTES,
    SEUILS_PRO,
    FICHIERS_CLIENT,
    CONTRAT_CLIENT,
    ACCES_TECHNICIEN_CLIENT,
    REFUS_DONNEES,
  ],
}

const TECHNICIEN: Guide = {
  title: 'Procédure du technicien',
  intro: 'Intervenir chez un client : ouvrir son compte, choisir et installer la bonne source, régler les compteurs, les noms et les fichiers, vérifier, clôturer.',
  sections: [
    {
      id: 'regles',
      title: 'Les règles',
      blocks: [
        {
          kind: 'list',
          items: [
            'C’est le client (titulaire du compte) qui vous ouvre son compte, pour 1 à 30 jours. Sans cela, vous ne voyez rien.',
            'Vous ne touchez qu’à l’installation : sources, compteurs, correspondances, fichiers. Factures, abonnement, équipe et paramètres vous restent fermés.',
            'Chacune de vos actions est inscrite dans le Journal du client sous « Votre nom (technicien Nouankany) ».',
            'Une clé ou un code ne s’affiche qu’une fois : transmettez-le au client ou à son intégrateur sur place, jamais par un canal public.',
          ],
        },
      ],
    },
    {
      id: 'ouvrir',
      title: 'Ouvrir le compte du client',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Le client clique sur « Accès technicien », « Autoriser », pour la durée de l’intervention.',
            'Dans Interventions, son compte apparaît avec la date de fin d’accès. Cliquez sur « Intervenir ».',
            'Un bandeau rappelle dans quel compte vous travaillez. « Quitter l’intervention » vous ramène à votre liste.',
            'Onglet « Alertes » : les alertes ouvertes du client, avec la recommandation, et celles qui sont terminées. Après une intervention, répondez à « Qu’avez-vous fait ? » : votre réponse est inscrite au journal du client, à votre nom.',
          ],
        },
      ],
    },
    {
      id: 'choisir',
      title: 'Choisir la bonne source',
      blocks: [
        {
          kind: 'table',
          head: ['Sur place, vous trouvez', 'Source', 'Retard des mesures'],
          rows: [
            ['Des compteurs Modbus (ou rien) et pas de logiciel', 'Passerelle de mesure', '≈ 1 minute'],
            ['Une supervision ou GTB qui sait envoyer en HTTPS', 'Logiciel du client', '≈ 1 minute'],
            ['Une supervision qui expose ses valeurs en Modbus-TCP', 'Passerelle de mesure, qui lit la supervision comme un compteur', '≈ 1 minute'],
            ['Un logiciel qui ne sait qu’exporter des fichiers', 'Dépôt de fichiers', '≈ 1 jour'],
            ['Un ménage qui veut le boîtier qui parle', 'Boîtier Nouankany', '≈ 1 minute'],
            ['Un appareil à mesurer seul, ou à pouvoir couper', 'Capteur d’un appareil', '≈ 1 minute'],
          ],
        },
        { kind: 'note', text: 'Préférez toujours la passerelle quand c’est possible : aucun travail pour le client, et nous maîtrisons les unités.' },
      ],
    },
    {
      id: 'menage',
      title: 'Chez un ménage',
      blocks: [
        { kind: 'p', text: 'Un ménage a le boîtier qui parle, pas de passerelle. Il vous ouvre son compte comme un professionnel (Paramètres, « Accès technicien »).' },
        {
          kind: 'steps',
          items: [
            'Dans l’intervention, « Ajouter une source », « Je veux le boîtier qui parle » : nommez-le (« Boîtier du salon »). Si le compte n’a pas de site, le boîtier couvre tous ses appareils.',
            'Le code s’affiche une fois (15 minutes) : saisissez-le sur le boîtier. Il passe « En ligne ».',
            'Vérifiez que les appareils du foyer sont déclarés avec leur vraie puissance (plaque signalétique).',
            'Montrez au client sa page « Mon boîtier » : c’est lui qui choisit les appareils que le boîtier peut éteindre, et les quatre lumières.',
          ],
        },
      ],
    },
    {
      id: 'capteur',
      title: 'Poser le capteur d’un appareil',
      blocks: [
        { kind: 'p', text: 'Le capteur : un ESP32 avec un module de mesure PZEM-004T (puissance, énergie, tension, courant, facteur de puissance), une sonde de température en option, un relais en option pour couper. Il envoie lui-même par le wifi du client.' },
        {
          kind: 'steps',
          items: [
            'L’appareil doit être déclaré dans le compte, avec sa vraie puissance (plaque signalétique) : la lecture d’essai la compare.',
            'Dans l’intervention, fiche de l’appareil, « Ajouter un capteur » (ou « Ajouter une source », « Je veux un capteur sur un appareil »). Cochez relais et sonde selon le matériel posé.',
            'Saisissez le code (15 minutes, une seule fois) sur le capteur, avec le wifi du client.',
            'Attendez la lecture d’essai sur la fiche de la source : « En service », sinon voir « Comprendre la lecture d’essai ».',
            'Relais posé : montrez au client sa page « Mon boîtier ». C’est lui qui rend l’appareil éteignable ; faites un essai de coupure avec lui.',
          ],
        },
        { kind: 'note', text: 'Un appareil n’accepte qu’un capteur actif. Le capteur garde ses mesures en mémoire pendant une coupure d’internet ; la plateforme les accepte jusqu’à 30 jours de retard.' },
      ],
    },
    {
      id: 'passerelle',
      title: 'Installer une passerelle',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Sources de mesures, « Ajouter une source », « Passerelle de mesure » : nommez-la et choisissez le site.',
            'Le code d’appairage s’affiche (une fois, 15 minutes) : saisissez-le sur la passerelle. Elle passe « En ligne ».',
            'Câblage RS485 : paire torsadée, A sur A et B sur B tout le long, une résistance de 120 Ω à chaque extrémité de la ligne, une adresse (esclave) différente par compteur, la même vitesse partout.',
            'Sur la fiche de la passerelle, « Ajouter un compteur » pour chaque compteur : appareil mesuré, modèle, liaison (RS485 ou réseau), adresse.',
            'La passerelle fait une lecture d’essai dans la minute. Attendez « En service » ; la page se rafraîchit seule.',
          ],
        },
        {
          kind: 'table',
          head: ['Modèle de la liste', 'Ce qui est lu', 'Vitesse par défaut'],
          rows: [
            ['Eastron SDM120 (monophasé)', 'puissance, énergie importée, tension, courant, facteur de puissance', '2 400 bauds'],
            ['Eastron SDM630 (triphasé)', 'puissance totale, énergie importée, tension et courant de la phase 1, facteur de puissance', '9 600 bauds'],
          ],
        },
        { kind: 'p', text: 'Ces tables ont été vérifiées sur la notice du fabricant et une seconde source. Pour tout autre compteur (Schneider, Socomec, Chint…), les registres changent selon le modèle et le micrologiciel : choisissez « Autre compteur » et recopiez-les depuis la notice du compteur posé.' },
      ],
    },
    {
      id: 'autre-compteur',
      title: 'Saisir un « autre compteur »',
      blocks: [
        {
          kind: 'list',
          items: [
            'Fonction : 4 si la notice donne des adresses 3xxxx (registres d’entrée), 3 si elle donne 4xxxx (registres de maintien).',
            'Adresse : comptée depuis 0. Si vous saisissez l’adresse de la notice (30053), le formulaire la convertit (52, fonction 4).',
            'Type : float32 (le plus courant, deux registres, poids fort d’abord), float32_swapped (registres inversés), int32 / uint32, int16 / uint16.',
            'Facteur : ce qui ramène à notre unité. W → kW : 0,001. Dixièmes de volt : 0,1. Pourcentage → 0 à 1 : 0,01.',
            'Lisez au moins la puissance (kW) ou l’énergie (kWh cumulés).',
          ],
        },
      ],
    },
    {
      id: 'essai',
      title: 'Comprendre la lecture d’essai',
      blocks: [
        { kind: 'p', text: 'La plateforme juge la lecture d’essai avant de mettre le compteur en service :' },
        {
          kind: 'table',
          head: ['Contrôle', 'Refusé si'],
          rows: [
            ['Puissance', 'négative, ou plus de 1,5 fois la puissance de l’appareil (vers 1 000 fois : des W lus comme des kW)'],
            ['Tension', 'hors de 90 à 480 V'],
            ['Facteur de puissance', 'hors de 0 à 1'],
            ['Énergie, courant', 'négatifs'],
            ['Ensemble', 'ni puissance ni énergie lue'],
          ],
        },
        { kind: 'p', text: 'Un compteur « À vérifier » n’est plus lu. Corrigez (câblage, modèle, facteur), puis « Relancer l’essai ». S’il reste « Lecture d’essai en attente » plus de deux minutes : la passerelle est hors ligne, ou ne joint pas le compteur (câblage, adresse, vitesse).' },
      ],
    },
    {
      id: 'logiciel',
      title: 'Brancher le logiciel du client',
      blocks: [
        {
          kind: 'steps',
          items: [
            '« Ajouter une source », « Logiciel du client » : la plateforme affiche l’identifiant de la source et sa clé, une seule fois. Remettez-les à l’intégrateur.',
            'Sur la fiche, « Noms du logiciel » : reliez chaque nom utilisé par le logiciel (« COMP_01_kW ») à l’appareil Nouankany.',
            'L’intégrateur règle l’envoi selon le contrat ci-dessous. Vérifiez ensemble qu’une première mesure est acceptée.',
          ],
        },
        ...CONTRAT_BLOCKS,
        { kind: 'note', text: 'La plateforme refuse toute puissance au-delà de 50 fois celle de l’appareil (« unité attendue kW (des W ?) ») : le logiciel doit convertir en kW avant l’envoi. Clé perdue : « Remplacer la clé » ; l’ancienne cesse aussitôt de marcher.' },
      ],
    },
    {
      id: 'fichiers',
      title: 'Régler un dépôt de fichiers',
      blocks: [
        {
          kind: 'steps',
          items: [
            '« Ajouter une source », « Dépôt de fichiers » : notez l’identifiant et la clé (affichés une fois).',
            'Récupérez un vrai fichier exporté par le logiciel du client et envoyez-le dans « Aperçu » : colonnes et premières lignes s’affichent.',
            'Dites quelle colonne contient la date, l’appareil (ou l’appareil unique du fichier), la puissance ET son unité (W, kW, MW), ou l’énergie, son unité (Wh, kWh, MWh) et sa nature : « index » si elle ne fait que monter, « intervalle » si c’est la consommation de chaque pas de temps (avec sa durée).',
            'Décalage horaire : 0 en Côte d’Ivoire ; sinon, le décalage de l’heure du fichier par rapport à UTC.',
            'Si le fichier nomme les appareils, reliez ces noms (« Noms du logiciel »), ou utilisez les codes Nouankany.',
            'Déposez le fichier : l’historique dit combien de mesures sont gardées et pourquoi les autres sont refusées.',
            'Dépôt automatique : le logiciel du client (ou une tâche planifiée) envoie le fichier chaque jour avec la clé.',
          ],
        },
        {
          kind: 'code',
          text: [
            'POST /api/v1/boitier/token   {"device_id": "<identifiant>", "secret": "<clé>"}',
            'curl -H "Authorization: Bearer <jeton>" -F "file=@export-du-jour.csv" https://<plateforme>/api/v1/boitier/fichiers',
          ].join('\n'),
        },
        { kind: 'list', items: ['CSV (« ; » ou « , ») ou XLSX ; 20 Mo, 200 000 lignes et 60 colonnes au plus ; 60 fichiers par heure au plus.', 'Un fichier peut remonter jusqu’à un an : utile pour reprendre l’historique du client.', 'Redéposer un fichier ne crée jamais de doublon.'] },
      ],
    },
    {
      id: 'node-red',
      title: 'Repli : modèle Node-RED',
      blocks: [
        { kind: 'p', text: 'Pour le client qui refuse notre passerelle mais a des compteurs Modbus sur son réseau et un ordinateur ou automate qui fait tourner Node-RED. Le modèle lit les compteurs chaque minute, convertit dans nos unités et envoie comme un « Logiciel du client ». À n’utiliser qu’en dernier recours : la passerelle reste la solution normale.' },
        {
          kind: 'steps',
          items: [
            'Sur la plateforme, créez une source « Logiciel du client » : notez l’identifiant et la clé. Dans « Noms du logiciel », reliez le nom de chaque compteur (par exemple COMPRESSEUR_1) à son appareil.',
            'Sur la machine du client, installez Node-RED puis le module « node-red-contrib-modbus » (Menu, Gérer la palette, Installer).',
            'Téléchargez le modèle (lien ci-dessous), puis dans Node-RED : Menu, Importer, choisissez le fichier.',
            'Ouvrez le nœud « Réglages » : adresse de la plateforme, identifiant, clé, puis un bloc par compteur (nom relié ou code Nouankany, adresse esclave, fonction, type de donnée, registres et facteurs, comme pour un « Autre compteur »).',
            'Ouvrez la liaison « Liaison compteurs (à régler) » : Serial pour un câble RS485 (port, vitesse, parité), ou TCP pour un compteur en réseau (adresse IP, port 502).',
            'Déployez. Sous « Résultat », l’état affiche « N gardée(s), M refusée(s) » chaque minute ; les raisons des refus s’affichent dans le panneau de débogage (fiches d’erreur plus bas).',
          ],
        },
        { kind: 'download', href: '/outils/nouankany-node-red.json', label: 'Télécharger le modèle Node-RED (nouankany-node-red.json)' },
        {
          kind: 'table',
          head: ['Vous voyez', 'Ce que ça veut dire'],
          rows: [
            ['« jeton refusé : Boîtier inconnu ou secret invalide »', 'Identifiant ou clé faux, ou clé remplacée sur la plateforme : recopiez-les dans « Réglages » et redéployez.'],
            ['« aucune mesure lue cette minute »', 'Le compteur ne répond pas ou la puissance n’est pas lue : vérifiez la liaison, l’adresse esclave et le registre de la puissance (obligatoire).'],
            ['« Mesure refusée : unité attendue kW (des W ?) »', 'Facteur manquant : mettez 0.001 sur la puissance si le compteur donne des watts.'],
          ],
        },
        { kind: 'note', text: 'Vérifié sur la version 5.60.2 du module Modbus, avec un compteur simulé en réseau : lecture, conversion, jeton, envoi, et arrêt net quand la clé est remplacée. Avec un vrai compteur, contrôlez les premières valeurs sur la plateforme avant de partir.' },
      ],
    },
    {
      id: 'verifier',
      title: 'Avant de partir',
      blocks: [
        {
          kind: 'list',
          items: [
            'Chaque source est « En ligne » (passerelle) ou a reçu une première mesure (logiciel, fichier).',
            'Chaque compteur est « En service ».',
            'Les appareils du client sont sur le bon site, avec leur vraie puissance nominale (plaque signalétique).',
            'Le client sait où voir ses alertes et que l’email d’alerte part au titulaire du compte.',
            'Rappelez au client qu’il peut retirer votre accès (« Accès technicien », « Retirer l’accès ») ; sinon il expire de lui-même.',
          ],
        },
      ],
    },
  ],
}

const ADMIN: Guide = {
  title: 'Guide de l’administrateur',
  intro: 'Faire tourner la plateforme : comptes et rôles, boîtiers, sources de mesures, alertes, journal.',
  sections: [
    {
      id: 'roles',
      title: 'Comptes et rôles',
      blocks: [
        {
          kind: 'table',
          head: ['Rôle', 'Peut', 'Donné par'],
          rows: [
            ['Client (ménage, PME, industrie)', 'Son compte et ses données', 'Inscription'],
            ['Technicien', 'Installer dans le compte d’un client qui l’y autorise, et rien d’autre', 'Superadmin (Utilisateurs, fiche du compte, rôle)'],
            ['Administrateur', 'Les pages d’administration', 'Superadmin'],
            ['Superadmin', 'Tout, dont les rôles et la suppression de comptes', 'Le propriétaire, par le script promote_admin.py'],
          ],
        },
        { kind: 'p', text: 'Un technicien n’a aucun accès aux comptes clients par son rôle seul : c’est le client qui ouvre son compte, pour une durée. Retirer le rôle d’un technicien coupe toutes ses interventions.' },
      ],
    },
    {
      id: 'boitiers',
      title: 'Boîtiers et demandes',
      blocks: [
        {
          kind: 'steps',
          items: [
            'Demandes à livrer (page Boîtiers) : contactez le client, livrez, puis « Marquer comme livré » (inscrit dans l’Audit du compte).',
            'Liste de tous les boîtiers et sources : état de connexion, activité des dernières 24 heures.',
            'Révoquer un boîtier ou une source (perte, vol, fin de contrat) : il perd l’accès immédiatement, même avec un jeton encore valable.',
          ],
        },
      ],
    },
    {
      id: 'sources',
      title: 'Sources de mesures et compteurs',
      blocks: [
        { kind: 'p', text: 'Quatre types : boîtier vocal (ménages), passerelle muette (PME, industrie), logiciel du client, dépôt de fichiers. Toutes envoient dans les mêmes unités (kW, kWh, V, A, 0 à 1, °C, mm/s, bar, UTC) et passent les mêmes contrôles (bornes, dates, doublons, garde des unités à 50 fois la puissance nominale).' },
        { kind: 'p', text: 'Ajouter un modèle de compteur à la liste demande un développement : sa table de registres doit être vérifiée sur la notice du fabricant et une seconde source indépendante. En attendant, les techniciens utilisent « Autre compteur ».' },
      ],
    },
    {
      id: 'alertes',
      title: 'Alertes immédiates et emails',
      blocks: [
        { kind: 'p', text: 'Chaque lot de mesures est comparé aux seuils ; un dépassement ouvre une alerte et envoie l’email « alerte critique sur un appareil » au titulaire, s’il n’a pas coupé ses avis. Chaque envoi est tracé (journal des emails), sans son contenu. Sans configuration SMTP, rien ne part et l’envoi est tracé « non configuré ».' },
      ],
    },
    {
      id: 'journal',
      title: 'Journal et audit',
      blocks: [
        { kind: 'p', text: 'Les actions d’un technicien apparaissent dans l’audit du client sous « Nom (technicien Nouankany) » ; l’ouverture et le retrait de l’accès par le client y sont aussi. Pour savoir qui a réglé un compteur ou une clé, filtrez la famille « boîtier ».' },
      ],
    },
  ],
}

export const GUIDES: Record<Profile, Guide> = { menage: MENAGE, pme: PME, industrie: INDUSTRIE, technicien: TECHNICIEN, admin: ADMIN }
