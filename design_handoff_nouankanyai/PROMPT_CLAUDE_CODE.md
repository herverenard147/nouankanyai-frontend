# Prompt à coller dans Claude Code

Copie tout ce qui est entre les deux lignes de tirets dans Claude Code, à la racine du dépôt,
avec le dossier `design_handoff_nouankanyai/` présent dans le projet.

---

Tu vas construire le front-end fonctionnel de **NouanKanyAI**, une plateforme de prédiction
et de maîtrise de la consommation électrique pour les ménages, PME et industries en Côte
d'Ivoire. Le produit est un MVP logiciel : **aucun capteur IoT n'est déployé**, les modèles
sont entraînés sur données synthétiques.

## Ce que tu as en entrée

Le dossier `design_handoff_nouankanyai/` contient :

- `README.md` : la spécification de design complète. **C'est la source de vérité** pour les
  couleurs, la typographie, les espacements, les rayons, les états d'interaction, la
  hiérarchie de l'information et le contenu de chaque écran. Lis-le en entier avant d'écrire
  une ligne de code.
- `Landing.dc.html` et `Dashboard.dc.html` : les maquettes haute fidélité, à ouvrir dans un
  navigateur pour voir le rendu attendu. Ce sont des **références de design**, pas du code de
  production. Elles utilisent un runtime maison (`support.js`) : **ne le porte pas**. Lis les
  templates comme du JSX et les classes de logique comme des composants à état.
- `logo.png` : le logo, fond transparent.
- `nouankanyai-design-brief.md` : le brief produit d'origine.

## Ce que tu dois produire

Une application front-end **fonctionnelle et navigable**, avec :

1. Une **page de connexion**.
2. Un **dashboard complet, multi-pages**, dont le contenu dépend du profil de l'utilisateur
   connecté.
3. La **landing page** publique, portée depuis la maquette.

### Contrainte structurelle importante

**Il n'y a plus de sélecteur de profil dans l'interface.** Le sélecteur de vue présent en
haut de `Dashboard.dc.html` était un outil de maquette : supprime-le. Le profil
(`menage | pme | industrie | admin`) vient du compte connecté et détermine ce que
l'utilisateur voit. Un utilisateur ne peut jamais accéder aux pages d'un autre profil, ni à
l'Admin s'il n'est pas admin. Le seul sélecteur qui reste visible est le **sélecteur de
niveau** (`débutant / amateur / technique`), modifiable à tout moment.

## Stack

Choisis et justifie en une ligne, puis tiens-toi à ton choix. Par défaut, sauf si le dépôt
impose déjà autre chose : **React + TypeScript + Vite**, React Router pour le routage,
Tailwind CSS avec les tokens du README déclarés en thème, TanStack Query pour la couche de
données, Zustand ou le contexte React pour la session et le niveau. Aucune librairie de
graphiques : les graphiques du handoff sont faits en flex et se portent tels quels en
composants. Aucune librairie de composants UI : tout est spécifié dans le README.

Pas de backend à écrire. Toute la donnée vient d'une **couche mock isolée**
(`src/mocks/`), typée, avec un délai artificiel, derrière une interface d'API unique
(`src/api/`) qu'il suffira de rebrancher sur le vrai backend plus tard. Chaque bloc de
l'interface consomme **sa propre requête**, pas un appel global : c'est ce qui permet le
rendu dégradé métrique par métrique du Portail Admin.

## Authentification

Page de connexion à concevoir dans le langage visuel du handoff, sobre : logo, titre, champ
email, champ mot de passe avec bascule d'affichage, lien « mot de passe oublié » inactif,
bouton primaire « Se connecter », lien vers la landing. Validation côté client (email
valide, mot de passe non vide), états `idle / loading / error`, message d'erreur en
`#D6293E` sous les champs, jamais une alerte navigateur.

Auth mockée : quatre comptes de démonstration, un par profil, listés dans un encart discret
sous le formulaire (c'est un MVP de démonstration, l'encart est assumé). Session persistée
en `localStorage`, route protégée, redirection vers `/login` si non connecté, redirection
vers le dashboard du profil après connexion. Bouton de déconnexion dans le rail latéral.

## Arborescence des routes

```
/                        landing publique
/login                   connexion
/app                     redirige vers la première page du profil connecté
/app/apercu              vue d'ensemble (tous profils)
/app/alertes             alertes (tous profils)
/app/consommation        conso & coûts (tous profils)
/app/prediction          prédiction (tous profils)
/app/factures            factures et upload OCR (ménage, PME)
/app/conseils            conseils (ménage, PME, industrie)
/app/equipements         équipements (PME)
/app/machines            machines (industrie)
/app/anomalies           anomalies et résolutions (industrie)
/app/rapports            rapports (PME, industrie)
/app/journal             journal (industrie, admin)
/app/parametres          paramètres et niveau (tous profils)
/app/admin/sante         santé plateforme (admin)
/app/admin/modeles       modèles et observabilité (admin)
/app/admin/utilisateurs  utilisateurs (admin)
```

Le rail latéral n'affiche que les entrées autorisées pour le profil connecté, dans l'ordre
donné par le README. Une route interdite renvoie vers `/app`, jamais un écran d'erreur brut.

## Contenu des pages

Le README décrit précisément le contenu de la vue d'ensemble des quatre profils, plus
l'écran mobile Ménage. Reprends ces données mockées **à l'identique**, chiffres et libellés
compris. Pour les pages qui n'étaient pas maquettées, tu déduis la mise en page des mêmes
composants, sans en inventer de nouveaux :

- **Alertes** : les deux registres séparés (action humaine requise, action automatique
  journalisée), avec un historique des alertes passées et leur résolution.
- **Consommation & coûts** : graphique à axes sur une période sélectionnable (30 jours pour
  la formule Essentiel, quotidien pour Intelligent), barre de paliers tarifaires CIE,
  répartition par poste ou par équipement selon le profil.
- **Prédiction** : la carte de prédiction du handoff en grand, plus l'intervalle et les
  métadonnées de modèle.
- **Factures** : liste des factures envoyées, upload par photo, aperçu de l'extraction OCR
  champ par champ avec correction manuelle possible.
- **Conseils** : liste ordonnée par impact, avec le critère d'impact propre au profil
  (facture pour le ménage, marge pour la PME, plan chiffré pour l'industrie).
- **Équipements / Machines** : la table du handoff, triable et filtrable, avec une fiche de
  détail par ligne.
- **Anomalies** : détections Isolation Forest avec score de sévérité, et l'historique des
  résolutions.
- **Rapports** : rapport hebdomadaire ou mensuel, lisible sans expertise technique pour la
  PME, chiffré pour l'industrie.
- **Journal** : journal d'activité agrégé, filtrable par type.
- **Paramètres** : profil, formule, seuils (global pour le ménage, par appareil pour la PME,
  multi-niveaux 70/90/100 % pour l'industrie), niveau d'affichage, déconnexion.
- **Admin** : santé plateforme, modèles et observabilité, utilisateurs.

## Règles produit non négociables

1. **Une donnée est mesurée, estimée, ou synthétique. Jamais inventée.** Chaque valeur
   affichée porte son badge de provenance, partout, y compris dans les graphiques, les
   tables et les extractions OCR.
2. **Le badge `mesuré` ne s'affiche nulle part** dans l'état actuel : aucun capteur n'est
   déployé. Le composant doit supporter la valeur, prête à être activée site par site.
   Valeurs utilisées aujourd'hui : `estimé`, `synthétique`, `télémétrie système`.
3. **Hiérarchie de l'information, ordre non négociable sur toute page qui en contient
   plusieurs** : alerte active d'abord et visuellement dominante, puis les KPI de
   consommation et coût, puis la prédiction IA. Jamais l'inverse.
4. **Les deux registres d'alerte ne se mélangent jamais** : l'action humaine requise est une
   carte teintée `#fdf3f4` bordée `#D6293E` avec disque rouge, sur-titre rouge et bouton
   d'action ; l'action automatique déjà exécutée est un bloc `#eaf4ee` bordé `#1B7A43`, sous
   un intertitre explicite, sans bouton. Pas de liseré vertical, pas de ruban.
5. **Aucune promesse de temps réel.** L'encart permanent du rail rappelle qu'aucun capteur
   n'est déployé.
6. **Rendu dégradé, jamais d'écran d'erreur global.** Chaque carte gère son propre état
   `chargement / vide / indisponible` en conservant son titre et sa mention de fenêtre. La
   latence API s'affiche toujours avec sa fenêtre glissante et son compteur d'échantillons,
   jamais une moyenne seule.
7. **Copywriting** : pas de tiret cadratin dans le corps de texte, pas de badge pilule
   au-dessus des titres, pas de promesse générique « IA / temps réel / rentabilité
   maximale », aucun témoignage fabriqué. Toute accroche décrit une action réelle du
   produit. Interface entièrement en français, formats de nombres français, montants en
   FCFA, chiffres en IBM Plex Mono avec `font-variant-numeric: tabular-nums`.

## Fidélité visuelle

Respecte à la lettre les tokens du README : couleurs, échelle typographique, espacements sur
grille de 4 px, rayons (cartes 20 px, cartes segment 24 px, pricing 26 px, boutons et champs
14 px, badges 99 px), ombres, états de survol. N'invente aucune couleur. Pas de gradient
décoratif, pas de blob de fond, pas d'emoji.

Accessibilité, à ne pas régresser : texte blanc sur `#7a2c05` pour les boutons et jamais sur
`#E8590C` ; cibles tactiles de 44 px minimum, 48 px sur mobile ; `outline: 2px solid #E8590C`
avec `outline-offset: 2px` sur tous les `:focus-visible` ; `prefers-reduced-motion`
respecté ; images sans `src` vide ; `alt` sur chaque image ; navigation clavier complète, y
compris pour le widget assistant et les infobulles de graphique.

Responsive : le dashboard doit être utilisable en mobile. Le rail devient un tiroir, les
grilles passent en une colonne, l'écran mobile Ménage du handoff donne la référence de mise
en page et de densité. Sur les graphiques, la valeur s'affiche au survol sur desktop et au
toucher sur mobile.

## Composants transverses à écrire une seule fois

`ProvenanceBadge`, `AlertCard` (deux registres), `LevelSelector`, `KpiCard`, `TariffBar`,
`BarChart` (axes gradués, cadre, infobulle au survol et au toucher, axe Y éventuellement
tronqué signalé par ses graduations), `PredictionPanel`, `DataTable`, `UploadCard` avec
aperçu OCR, `AssistantWidget` (replié par défaut en bulle 48 px ancrée en bas à droite,
panneau de 306 px à l'ouverture, absent des pages Admin), `MetricState` pour les états
indisponibles, `PageHeader`, `SideRail`, `TopBar`.

## Critères d'acceptation

- Les quatre profils se connectent et voient uniquement leurs pages. Aucun sélecteur de
  profil nulle part dans l'interface.
- Toutes les routes listées existent, sont atteignables par le rail, et affichent du contenu
  réel issu de la couche mock. Aucune page vide, aucun « coming soon ».
- Aucune valeur affichée sans badge de provenance. Le mot `mesuré` n'apparaît dans aucun
  rendu.
- Sur chaque page contenant les trois, l'ordre alerte → KPI → prédiction est respecté dans
  le DOM et à l'écran.
- Le niveau se change depuis n'importe quelle page et persiste au rechargement.
- Une requête mock mise en échec fait apparaître l'état « indisponible » de sa seule carte,
  le reste de la page continue de fonctionner.
- Zéro erreur de console, zéro avertissement React, build de production qui passe.
- `npm run dev` suffit à tout démontrer, sans backend.

## Livrables attendus

Le code, plus un `README.md` à la racine qui explique le lancement, les comptes de
démonstration, la structure des dossiers, et l'emplacement exact de la couche mock à
remplacer par le vrai backend, endpoint par endpoint.

Commence par lire `design_handoff_nouankanyai/README.md` et ouvrir les deux maquettes, puis
propose-moi ton plan de fichiers et ta liste de composants avant d'implémenter.

---
