import type { Profile } from '@/types/domain'

/**
 * Messages d'erreur de la plateforme, expliqués (documentation, 2026-10-16). Chaque fiche dit le message tel qu'il
 * s'affiche, ce qu'il veut dire et comment le résoudre, pour les profils concernés : un technicien et un client ne
 * lisent pas la même chose. `match` reconnaît le message renvoyé par le serveur (textes de
 * backend/app/api/v1/boitier/router.py, intervention/router.py, app/boitier/meters.py, file_source.py, ingest.py) :
 * l'écran qui affiche l'erreur propose alors « Que faire ? » vers la fiche.
 */
export interface ErrorEntry {
  id: string
  /** Le message tel que la personne le voit (forme générale quand il contient une valeur). */
  message: string
  match: RegExp
  /** Où il apparaît. */
  where: string
  meaning: string
  fix: string[]
  audiences: Profile[]
}

const CLIENTS: Profile[] = ['menage', 'pme', 'industrie']
const PRO: Profile[] = ['pme', 'industrie']
const TECH: Profile[] = ['technicien']
const ALL: Profile[] = ['menage', 'pme', 'industrie', 'technicien', 'admin']

export const ERRORS: ErrorEntry[] = [
  // ------------------------------------------------------------------ général
  {
    id: 'serveur-injoignable',
    message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    match: /^Impossible de joindre le serveur/,
    where: 'Partout.',
    meaning: 'Votre appareil n’a pas pu parler à la plateforme : pas d’internet, réseau coupé, ou plateforme momentanément indisponible.',
    fix: ['Vérifiez votre connexion internet (ouvrez un autre site).', 'Réessayez dans une minute.', 'Si le problème dure plus de quinze minutes, écrivez à contact@nouankany.com.'],
    audiences: ALL,
  },
  {
    id: 'trop-de-tentatives',
    message: 'Trop de tentatives. Réessayez dans N minute(s).',
    match: /^Trop de tentatives/,
    where: 'Connexion, imports, dépôt de fichiers.',
    meaning: 'La même action a été faite trop souvent en peu de temps : la plateforme se protège (par exemple, 60 fichiers par heure au plus pour une source).',
    fix: ['Attendez le nombre de minutes indiqué, puis recommencez.', 'Pour un dépôt automatique de fichiers : réglez le logiciel pour envoyer un fichier par jour, pas un fichier par mesure.'],
    audiences: ALL,
  },
  {
    id: 'compte-inactif',
    message: 'Ce compte n’est plus actif.',
    match: /^Ce compte n'est plus actif/,
    where: 'Connexion, boîtier, sources de mesures.',
    meaning: 'Le compte a été suspendu ou supprimé. Ses boîtiers et sources ne peuvent plus rien envoyer.',
    fix: ['Client : contactez Nouankany (contact@nouankany.com) pour connaître la raison et faire réactiver le compte.', 'Administrateur : vérifiez l’état du compte dans Utilisateurs.'],
    audiences: ALL,
  },

  // ------------------------------------------------------------------ boîtier, passerelle : appairage et clés
  {
    id: 'code-appairage',
    message: 'Code d’appairage invalide ou expiré',
    match: /^Code d'appairage invalide ou expiré/,
    where: 'Sur le boîtier ou la passerelle, au moment de saisir le code.',
    meaning: 'Le code n’existe pas, a déjà servi, ou a plus de 15 minutes. Un code ne sert qu’une seule fois.',
    fix: [
      'Demandez un nouveau code sur la plateforme (page Boîtier ou Sources de mesures) et saisissez-le dans les 15 minutes.',
      'Le code ne contient jamais les caractères O, 0, I ou 1 : si vous croyez en voir un, relisez-le.',
      'Ne fermez pas la fenêtre du code avant que l’appareil soit connecté.',
    ],
    audiences: ALL,
  },
  {
    id: 'site-requis',
    message: 'Un boîtier est rattaché à un site : site_id est requis',
    match: /site_id est requis/,
    where: 'Création d’un boîtier ou d’une source.',
    meaning: 'Chaque boîtier, passerelle ou source appartient à un site (un lieu). Aucun site n’a été choisi.',
    fix: ['Choisissez le site dans la liste.', 'Pas encore de site ? Créez-le dans Paramètres, rubrique Sites (PME, industrie), ou dans la fenêtre de demande du boîtier (ménage).'],
    audiences: ALL,
  },
  {
    id: 'site-introuvable',
    message: 'Site introuvable',
    match: /^Site introuvable/,
    where: 'Création d’un boîtier ou d’une source.',
    meaning: 'Le site choisi n’existe plus ou n’appartient pas à ce compte (il a pu être supprimé entre-temps).',
    fix: ['Rechargez la page et choisissez un site de la liste.'],
    audiences: ALL,
  },
  {
    id: 'boitier-introuvable',
    message: 'Boîtier introuvable',
    match: /^Boîtier introuvable/,
    where: 'Fiche d’un boîtier ou d’une source.',
    meaning: 'Ce boîtier ou cette source a été révoqué, ou appartient à un autre compte.',
    fix: ['Revenez à la liste : seuls les boîtiers et sources actifs du compte y figurent.', 'Technicien : vérifiez que vous êtes bien dans le compte du bon client.'],
    audiences: ALL,
  },
  {
    id: 'cle-invalide',
    message: 'Boîtier inconnu ou secret invalide · Boîtier inconnu ou révoqué',
    match: /^Boîtier inconnu ou (secret invalide|révoqué)/,
    where: 'Côté appareil : passerelle, logiciel du client ou script de dépôt de fichiers, au moment de demander un jeton ou d’envoyer.',
    meaning: 'La clé (secret) ne correspond plus : la source a été révoquée, ou sa clé a été remplacée (« Remplacer la clé »), ou l’identifiant de la source est faux.',
    fix: [
      'Sur la fiche de la source, vérifiez qu’elle est toujours active.',
      'Passerelle : refaites l’appairage avec un nouveau code.',
      'Logiciel ou fichiers : « Remplacer la clé », puis reportez la nouvelle clé ET l’identifiant de la source dans le logiciel du client. L’ancienne clé ne marche plus.',
    ],
    audiences: [...TECH, 'admin'],
  },
  {
    id: 'jeton',
    message: 'Jeton invalide ou expiré · Authentification du boîtier requise · Ce jeton n’est pas un jeton de boîtier',
    match: /^(Jeton invalide ou expiré|Authentification du boîtier requise|Ce jeton n'est pas un jeton de boîtier)/,
    where: 'Côté appareil, à chaque envoi.',
    meaning: 'L’envoi n’a pas de jeton valable. Un jeton dure 60 minutes ; un jeton de connexion d’une personne ne remplace pas celui d’une source.',
    fix: [
      'Demandez un nouveau jeton avec l’identifiant et la clé de la source (POST /api/v1/boitier/token), puis renvoyez.',
      'Programmez le renouvellement du jeton avant 60 minutes, ou à chaque refus 401.',
      'Envoyez l’en-tête « Authorization: Bearer <jeton> ».',
    ],
    audiences: TECH,
  },
  {
    id: 'source-revoquee',
    message: 'Cette passerelle a été révoquée. · Cette source a été révoquée.',
    match: /a été révoquée\.$/,
    where: 'Réglages d’une passerelle ou d’une source.',
    meaning: 'La source n’est plus active : on ne peut plus la régler.',
    fix: ['Créez une nouvelle source à la place, puis refaites ses réglages (compteurs, noms, colonnes).'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'appareil-hors-source',
    message: 'Appareil introuvable pour ce boîtier · Appareil introuvable pour cette source.',
    match: /^Appareil (\S+ )?introuvable pour (ce boîtier|cette source)/,
    where: 'Ajout d’un compteur, correspondances, réglage d’un fichier, commande.',
    meaning: 'Une source ne voit que les appareils de son site. L’appareil choisi est sur un autre site, ou rattaché à aucun site alors que le compte en a plusieurs.',
    fix: [
      'Rattachez l’appareil au bon site (page Équipements ou Machines, « Modifier », champ Site).',
      'Ou créez la source sur le site de l’appareil.',
    ],
    audiences: [...CLIENTS, ...TECH],
  },
  {
    id: 'canal-commande',
    message: 'Un canal de commande est requis pour rendre une machine commandable',
    match: /^Un canal de commande est requis/,
    where: 'Fiche du boîtier, « éteignable à la voix ».',
    meaning: 'Pour qu’un boîtier puisse éteindre un appareil, il faut dire par quel moyen (prise ou capteur commandable).',
    fix: ['Choisissez le canal de commande proposé, ou laissez l’appareil non éteignable.'],
    audiences: CLIENTS,
  },

  // ------------------------------------------------------------------ passerelle et compteurs
  {
    id: 'passerelle-seule',
    message: 'Seule une passerelle lit des compteurs.',
    match: /^Seule une passerelle lit des compteurs/,
    where: 'Ajout d’un compteur.',
    meaning: 'Un compteur ne s’ajoute qu’à une source de type « passerelle de mesure ». Un boîtier vocal, un logiciel ou un dépôt de fichiers ne lit pas de compteur.',
    fix: ['Créez une passerelle (Sources de mesures, « Ajouter une source »), puis ajoutez-y le compteur.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'modele-inconnu',
    message: 'Modèle de compteur inconnu.',
    match: /^Modèle de compteur inconnu/,
    where: 'Ajout d’un compteur.',
    meaning: 'Le modèle choisi n’est pas dans la liste de la plateforme.',
    fix: ['Choisissez « Autre compteur » et saisissez ses registres d’après sa notice (voir la procédure technicien).'],
    audiences: TECH,
  },
  {
    id: 'tcp-adresse',
    message: 'Adresse réseau du compteur requise en Modbus-TCP.',
    match: /^Adresse réseau du compteur requise/,
    where: 'Ajout d’un compteur relié par le réseau.',
    meaning: 'En Modbus-TCP, la passerelle doit connaître l’adresse IP du compteur (ou de sa passerelle réseau).',
    fix: ['Saisissez l’adresse IP (par exemple 192.168.1.40) ; le port est 502 par défaut.', 'Relié par câble RS485 ? Choisissez « RS485 » à la place.'],
    audiences: TECH,
  },
  {
    id: 'compteur-introuvable',
    message: 'Compteur introuvable',
    match: /^Compteur introuvable/,
    where: 'Fiche d’une passerelle.',
    meaning: 'Ce compteur a été retiré de la passerelle.',
    fix: ['Rechargez la page.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'table-registres',
    message: 'Table de registres refusée (fonction, type, adresse, facteur, grandeur)',
    match: /^(Table de registres|Fonction Modbus|Type de donnée parmi|Au moins une grandeur|La puissance ou l'énergie doit être lue|Grandeur inconnue)|: (adresse entre 0 et 65535|facteur d'échelle positif|registre attendu)/,
    where: 'Ajout d’un « autre compteur ».',
    meaning: 'Les registres saisis ne sont pas complets ou pas valables.',
    fix: [
      '« Fonction Modbus » : 4 pour les registres d’entrée (adresses 3xxxx de la notice), 3 pour les registres de maintien (4xxxx).',
      '« adresse entre 0 et 65535 » : l’adresse se compte depuis 0 ; une notice qui écrit 30053 veut dire 52 en fonction 4 (le formulaire fait la conversion si vous saisissez 30053).',
      '« facteur d’échelle positif » : le nombre par lequel multiplier la valeur lue pour obtenir notre unité (0,001 pour des W en kW, 0,1 pour des dixièmes de volt).',
      '« La puissance ou l’énergie doit être lue » : renseignez au moins l’une des deux, ce sont elles qui servent aux calculs.',
    ],
    audiences: TECH,
  },
  {
    id: 'essai-watts',
    message: 'Puissance de X kW pour un appareil de Y kW : des W lus comme des kW ? (facteur 0,001)',
    match: /des W lus comme des kW/,
    where: 'Lecture d’essai d’un compteur (statut « À vérifier »).',
    meaning: 'La valeur lue est environ mille fois la puissance de l’appareil : le compteur donne des watts et le facteur n’a pas été appliqué.',
    fix: ['« Autre compteur » : mettez le facteur 0,001 sur la puissance, puis « Relancer l’essai ».', 'Modèle de la liste : vérifiez que c’est bien le bon modèle de compteur.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'essai-trop-fort',
    message: 'Puissance de X kW pour un appareil de Y kW',
    match: /^Puissance de [\d.,]+ kW pour un appareil de [\d.,]+ kW(?! : des W)/,
    where: 'Lecture d’essai d’un compteur.',
    meaning: 'La puissance lue dépasse 1,5 fois la puissance de l’appareil : le compteur mesure sans doute autre chose que cet appareil (tout un tableau, une autre ligne), ou la puissance de l’appareil est mal renseignée.',
    fix: [
      'Vérifiez que le compteur est bien sur la ligne de cet appareil.',
      'Vérifiez la puissance nominale de l’appareil (plaque signalétique) et corrigez-la si besoin.',
      'Un compteur qui mesure plusieurs appareils : reliez-le à un appareil « départ » qui représente l’ensemble.',
    ],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'essai-negatif',
    message: 'Puissance négative · courant négatif · énergie négative',
    match: /(puissance|Puissance) négative|courant négatif|énergie négative|Énergie négative|Courant négatif/,
    where: 'Lecture d’essai d’un compteur.',
    meaning: 'Le compteur voit l’énergie « repartir » vers le réseau : le tore ou la pince est posé à l’envers, ou les fils sont inversés.',
    fix: ['Retournez le tore (la flèche doit pointer vers l’appareil), ou inversez le branchement indiqué par la notice, puis « Relancer l’essai ».'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'essai-tension',
    message: 'Tension de X V hors de 90 à 480 V : registre ou facteur à revoir',
    match: /^Tension de [\d.,-]+ V hors de 90 à 480 V/,
    where: 'Lecture d’essai d’un compteur.',
    meaning: 'La tension lue n’a pas de sens pour un réseau électrique : mauvais registre, ou valeur en dixièmes de volt sans facteur.',
    fix: ['Vérifiez l’adresse du registre de tension dans la notice.', 'Si la notice parle de « 0,1 V », mettez le facteur 0,1.'],
    audiences: TECH,
  },
  {
    id: 'essai-facteur',
    message: 'Facteur de puissance de X, attendu entre 0 et 1',
    match: /acteur de puissance de [\d.,-]+, attendu entre 0 et 1/,
    where: 'Lecture d’essai d’un compteur.',
    meaning: 'Le facteur de puissance est donné en pourcentage ou en millièmes par ce compteur.',
    fix: ['Mettez le facteur 0,01 (pourcentage) ou 0,001 (millièmes), puis « Relancer l’essai ».'],
    audiences: TECH,
  },
  {
    id: 'essai-rien',
    message: 'Ni puissance ni énergie lue : rien d’utilisable pour les calculs',
    match: /^Ni puissance ni énergie lue/,
    where: 'Lecture d’essai d’un compteur.',
    meaning: 'La passerelle n’a lu ni la puissance ni l’énergie : le compteur ne répond pas sur ces registres.',
    fix: [
      'Vérifiez le câblage RS485 (A sur A, B sur B), l’adresse du compteur (esclave), la vitesse (bauds) et la résistance de fin de ligne.',
      'Vérifiez dans la notice que les registres saisis existent sur ce modèle.',
    ],
    audiences: TECH,
  },

  // ------------------------------------------------------------------ logiciel du client et fichiers
  {
    id: 'reserve-source',
    message: 'Réservé à une source « logiciel du client » ou « fichier ». · Réservé à une source « fichier ».',
    match: /^Réservé à une source/,
    where: 'Clé, correspondances, réglage des colonnes.',
    meaning: 'Cette action n’existe que pour ce type de source.',
    fix: ['Ouvrez la bonne source, ou créez une source du type voulu.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'source-muette',
    message: 'Cette source ne parle pas : elle envoie seulement des mesures.',
    match: /^Cette source ne parle pas/,
    where: 'Côté appareil, si une passerelle ou un logiciel appelle la conversation du boîtier.',
    meaning: 'Seul le boîtier vocal converse. Les autres sources envoient des mesures.',
    fix: ['Retirez cet appel du programme de la passerelle ou du logiciel.'],
    audiences: TECH,
  },
  {
    id: 'nom-double',
    message: 'Nom « X » en double.',
    match: /^Nom « .* » en double/,
    where: 'Correspondances des noms du logiciel.',
    meaning: 'Le même nom du logiciel est relié deux fois.',
    fix: ['Gardez une seule ligne par nom : un nom du logiciel désigne un seul appareil.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'colonnes-pas-reglees',
    message: 'Colonnes pas encore réglées : le technicien doit d’abord les indiquer sur la plateforme.',
    match: /^Colonnes pas encore réglées/,
    where: 'Historique des fichiers reçus.',
    meaning: 'Un fichier est arrivé avant le réglage des colonnes : rien n’en a été gardé.',
    fix: ['Réglez les colonnes (fiche de la source, « Régler les colonnes »), puis redéposez le fichier.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'fichier-vide',
    message: 'Fichier vide. · La première ligne doit porter les noms des colonnes.',
    match: /^(Fichier vide|La première ligne doit porter les noms des colonnes)/,
    where: 'Aperçu ou dépôt d’un fichier.',
    meaning: 'Le fichier n’a pas de lignes, ou sa première ligne n’est pas une ligne de titres.',
    fix: ['Exportez à nouveau avec la ligne de titres (Date, Appareil, Puissance…).'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'fichier-taille',
    message: 'Fichier trop volumineux (maximum 20 Mo). · Trop de lignes',
    match: /^(Fichier trop volumineux|Trop de lignes)/,
    where: 'Dépôt d’un fichier.',
    meaning: 'Un fichier peut faire 20 Mo et 200 000 lignes au plus.',
    fix: ['Exportez une journée (ou une semaine) par fichier plutôt qu’un historique entier.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'fichier-format',
    message: 'Fichier non pris en charge · Classeur illisible',
    match: /^(Fichier non pris en charge|Classeur illisible)/,
    where: 'Dépôt d’un fichier.',
    meaning: 'Seuls les fichiers CSV (séparés par « ; » ou « , ») et Excel XLSX sont lus. Un PDF ou un ancien format XLS ne l’est pas.',
    fix: ['Exportez en CSV ou en XLSX depuis le logiciel.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'colonne-absente',
    message: 'La colonne « X » n’existe pas dans le fichier.',
    match: /^La colonne « .* » n'existe pas dans le fichier/,
    where: 'Réglage des colonnes.',
    meaning: 'Le réglage nomme une colonne que le fichier d’exemple n’a pas (nom changé, espace en trop).',
    fix: ['Choisissez la colonne dans la liste proposée par l’aperçu, ne la retapez pas.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'reglage-incomplet',
    message: 'Colonne à choisir · Indiquez la colonne du nom de l’appareil… · Choisissez la colonne de la puissance ou celle de l’énergie.',
    match: /^(Colonne « .* » à choisir|Colonne à choisir|Indiquez la colonne du nom|Choisissez la colonne de la puissance)/,
    where: 'Réglage des colonnes.',
    meaning: 'Il manque une information : la date, l’appareil (une colonne ou un appareil unique), et la puissance ou l’énergie sont obligatoires.',
    fix: ['Complétez le champ signalé.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'reglage-unites',
    message: 'Unité de la puissance : W, kW ou MW. · Unité de l’énergie… · Durée de chaque pas de temps… · Décalage horaire…',
    match: /^(Unité de la puissance|Unité de l'énergie|Énergie : « index »|Durée de chaque pas de temps|Décalage horaire)/,
    where: 'Réglage des colonnes.',
    meaning: 'L’unité ou la nature d’une colonne n’est pas dite. La plateforme ne devine jamais une unité.',
    fix: [
      'Puissance : W, kW ou MW, comme écrit dans l’en-tête ou la notice du logiciel.',
      'Énergie : « index » si la valeur ne fait que monter (compteur), « intervalle » si c’est la consommation de chaque pas de temps, avec sa durée en minutes.',
      'Décalage horaire : 0 en Côte d’Ivoire (heure UTC).',
    ],
    audiences: [...PRO, ...TECH],
  },

  // ------------------------------------------------------------------ mesures ou lignes refusées
  {
    id: 'nom-non-relie',
    message: 'nom « X » non relié à un appareil : ajoutez la correspondance sur la plateforme',
    match: /non relié à un appareil/,
    where: 'Mesures du logiciel du client, lignes d’un fichier.',
    meaning: 'Le logiciel envoie un nom d’appareil que la plateforme ne connaît pas encore.',
    fix: ['Fiche de la source, « Noms du logiciel » : reliez ce nom à l’appareil Nouankany. Les mesures suivantes seront gardées ; renvoyez le fichier pour reprendre les lignes refusées.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'unite-kw',
    message: 'puissance de X kW incohérente pour un appareil de Y kW : unité attendue kW (des W ?)',
    match: /unité attendue kW/,
    where: 'Mesures de toute source, lignes d’un fichier.',
    meaning: 'La puissance reçue dépasse 50 fois celle de l’appareil : presque toujours des watts envoyés à la place de kilowatts. La mesure est refusée pour ne rien fausser.',
    fix: [
      'Logiciel du client : divisez les puissances par 1 000 avant l’envoi (notre unité est le kW).',
      'Fichier : dans le réglage des colonnes, choisissez l’unité « W » pour la puissance.',
      'Si l’appareil est vraiment plus gros : corrigez sa puissance nominale.',
    ],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'date-illisible',
    message: 'date illisible (exemple : 2026-09-01 08:00)',
    match: /^date illisible/,
    where: 'Lignes d’un fichier.',
    meaning: 'La date de cette ligne n’est pas dans un format reconnu.',
    fix: ['Formats lus : 2026-09-01 08:00, 2026-09-01T08:00:00, 01/09/2026 08:00 (avec ou sans secondes).'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'date-futur',
    message: 'date dans le futur',
    match: /^date dans le futur/,
    where: 'Mesures, lignes d’un fichier.',
    meaning: 'La mesure est datée de plus de 5 minutes dans le futur : horloge déréglée, ou heure locale envoyée comme une heure UTC.',
    fix: ['Envoyez les heures en UTC (Côte d’Ivoire : heure locale = UTC).', 'Fichier : vérifiez le « décalage horaire » du réglage.', 'Réglez l’horloge de l’appareil qui envoie (synchronisation NTP).'],
    audiences: TECH,
  },
  {
    id: 'trop-ancienne',
    message: 'mesure de plus de N jours',
    match: /^mesure de plus de \d+ jours/,
    where: 'Mesures, lignes d’un fichier.',
    meaning: 'Les envois directs acceptent 30 jours de retard, les fichiers un an. Au-delà, la mesure est refusée.',
    fix: ['Pour reprendre un historique plus ancien, contactez Nouankany.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'hors-bornes',
    message: 'X hors bornes (valeur)',
    match: /hors bornes/,
    where: 'Mesures, lignes d’un fichier.',
    meaning: 'Une valeur sort de ce qu’un appareil réel peut donner (capteur en panne ou erreur d’unité). Bornes : puissance 0 à 5 000 kW, température −40 à 400 °C, vibration 0 à 100 mm/s, pression 0 à 100 bar, tension 0 à 1 000 V, courant 0 à 5 000 A, facteur de puissance 0 à 1.',
    fix: ['Vérifiez l’unité de la grandeur citée (vibrations en mm/s, facteur de puissance entre 0 et 1, pas en %).', 'Si la valeur est réelle, le capteur est sans doute en défaut : faites-le contrôler.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'deja-recue',
    message: 'mesure déjà reçue',
    match: /^mesure déjà reçue/,
    where: 'Mesures, lignes d’un fichier.',
    meaning: 'Une mesure du même appareil à la même heure existe déjà. Rien n’est en double. C’est normal quand un fichier est redéposé.',
    fix: ['Rien à faire.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'premier-index',
    message: 'premier index de cet appareil : sert de point de départ',
    match: /^premier index de cet appareil/,
    where: 'Lignes d’un fichier dont l’énergie est un index.',
    meaning: 'La puissance se calcule entre deux index : le premier sert seulement de point de départ. C’est normal.',
    fix: ['Rien à faire.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'index-recul',
    message: 'index plus petit que le précédent, ou même date : compteur remis à zéro ?',
    match: /compteur remis à zéro/,
    where: 'Lignes d’un fichier dont l’énergie est un index.',
    meaning: 'L’index a baissé (compteur remplacé ou remis à zéro), ou deux lignes ont la même heure.',
    fix: ['Si le compteur a été changé, c’est normal : les lignes suivantes repartent du nouvel index.', 'Sinon, vérifiez que la colonne choisie est bien un index qui ne fait que monter ; sinon choisissez « intervalle ».'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'puissance-absente',
    message: 'puissance absente',
    match: /^puissance absente/,
    where: 'Lignes d’un fichier.',
    meaning: 'La ligne n’a ni puissance ni énergie utilisable (cellule vide).',
    fix: ['Normal pour une ligne de coupure ; sinon, vérifiez l’export.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'nom-absent',
    message: 'nom de l’appareil absent',
    match: /^nom de l'appareil absent/,
    where: 'Lignes d’un fichier.',
    meaning: 'La colonne de l’appareil est vide sur cette ligne.',
    fix: ['Vérifiez l’export, ou choisissez un « appareil unique » si le fichier ne concerne qu’un appareil.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'pas-un-nombre',
    message: '« X » n’est pas un nombre',
    match: /n'est pas un nombre/,
    where: 'Lignes d’un fichier.',
    meaning: 'Une cellule attendue en nombre contient du texte (« N/A », « erreur »…). Seule cette ligne est refusée.',
    fix: ['Rien à faire si c’est ponctuel ; sinon, vérifiez la colonne choisie.'],
    audiences: [...PRO, ...TECH],
  },
  {
    id: 'appareil-non-designe',
    message: 'appareil non désigné (machine_code ou external_ref) · appareil inconnu pour ce boîtier',
    match: /^appareil (non désigné|inconnu pour ce boîtier)/,
    where: 'Mesures envoyées par une passerelle ou un logiciel.',
    meaning: 'La mesure ne dit pas de quel appareil il s’agit, ou désigne un appareil qui n’est pas sur le site de la source.',
    fix: ['Chaque mesure porte machine_code (code Nouankany) ou external_ref (nom relié sur la plateforme).', 'Vérifiez que l’appareil est rattaché au site de la source.'],
    audiences: TECH,
  },

  // ------------------------------------------------------------------ accès technicien
  {
    id: 'pas-technicien',
    message: 'Seul un technicien Nouankany peut intervenir dans le compte d’un client.',
    match: /^Seul un technicien Nouankany peut intervenir/,
    where: 'Intervention dans un compte client.',
    meaning: 'Le compte connecté n’a pas le rôle « technicien ».',
    fix: ['Demandez au superadmin de vous donner le rôle « technicien » (Utilisateurs, fiche du compte).'],
    audiences: [...TECH, 'admin'],
  },
  {
    id: 'acces-non-accorde',
    message: 'Le client n’a pas accordé d’accès technicien, ou il a expiré.',
    match: /^Le client n'a pas accordé d'accès technicien/,
    where: 'Intervention dans un compte client.',
    meaning: 'Le client n’a pas ouvert son compte, ou l’a refermé, ou la durée choisie est passée.',
    fix: ['Demandez au client d’ouvrir « Accès technicien » (Sources de mesures ou Paramètres) pour la durée de l’intervention.'],
    audiences: TECH,
  },
  {
    id: 'titulaire-seul',
    message: 'Seul le titulaire du compte peut accorder ou retirer l’accès technicien.',
    match: /^Seul le titulaire du compte peut accorder/,
    where: 'Accès technicien.',
    meaning: 'Un membre d’équipe ne peut pas ouvrir le compte à un technicien : c’est une décision du titulaire.',
    fix: ['Demandez au titulaire du compte de le faire depuis son propre accès.'],
    audiences: PRO,
  },
  {
    id: 'reserve-techniciens',
    message: 'Réservé aux techniciens Nouankany.',
    match: /^Réservé aux techniciens Nouankany/,
    where: 'Liste des interventions.',
    meaning: 'Cette page est celle des techniciens.',
    fix: ['Rien à faire : votre compte n’en a pas besoin.'],
    audiences: ALL,
  },
  {
    id: 'compte-introuvable',
    message: 'Compte introuvable.',
    match: /^Compte introuvable/,
    where: 'Intervention dans un compte client.',
    meaning: 'Le compte n’existe plus, ou c’est un compte d’équipe ou d’administration.',
    fix: ['Revenez à la liste des interventions : seuls les comptes ouverts y sont.'],
    audiences: TECH,
  },

  // ------------------------------------------------------------------ administration
  {
    id: 'demande-livree',
    message: 'Cette demande est déjà livrée : elle ne peut plus être annulée',
    match: /^Cette demande est déjà livrée/,
    where: 'Demandes de boîtier.',
    meaning: 'Le boîtier a été remis : la demande est close.',
    fix: ['Pour retirer un boîtier livré, révoquez-le depuis sa fiche.'],
    audiences: [...CLIENTS, 'admin'],
  },
  {
    id: 'role',
    message: 'Rôle invalide · Impossible de modifier le rôle du superadmin',
    match: /^(Rôle invalide|Impossible de modifier le rôle du superadmin)/,
    where: 'Utilisateurs, changement de rôle.',
    meaning: 'Les rôles possibles sont client, administrateur et technicien ; celui du superadmin ne se change pas ici.',
    fix: ['Choisissez l’un des trois rôles proposés.'],
    audiences: ['admin'],
  },
]

/** Fiche qui explique ce message pour ce profil, s'il y en a une. */
export function errorHelp(message: string, profile: Profile): ErrorEntry | undefined {
  return ERRORS.find((entry) => entry.audiences.includes(profile) && entry.match.test(message))
}

export function errorsFor(profile: Profile): ErrorEntry[] {
  return ERRORS.filter((entry) => entry.audiences.includes(profile))
}
