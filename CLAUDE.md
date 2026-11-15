# Nouankany : instructions pour Claude Code (frontend)

Ce fichier est chargé automatiquement par Claude Code. Il documente des faits
et pièges déjà rencontrés sur ce dépôt : les revérifier coûte du temps, les
ignorer réintroduit des régressions déjà vues une fois. Le `README.md` est la
référence complète (structure, couche d'adaptation `src/api/`, comptes de
démo, mappings notables) : ne le duplique pas ici, ce fichier ne couvre que ce
qui n'y est pas ou ce qui a changé depuis.

## Ce dépôt est un frontend seul, branché sur un backend séparé

Le backend réel vit dans `../NouanKanyAI/` (dépôt git distinct,
`herverenard147/NouanKanyAI`, branche `main`). Ce dépôt-ci est
`herverenard147/nouankanyai-frontend` : une branche et une PR par sujet, seul `main` est mis en
ligne. Le dossier partagé local porte parfois des modifications d'une autre session : travailler
dans une copie séparée (`git worktree`) partant de `origin/main`.

## État du projet : `docs/SUIVI_TECHNIQUE.md` du dépôt backend

À lire avant de revérifier quoi que ce soit (ce qui est en ligne, tests de référence, pièges, points ouverts).

## Design et écrans : lire `DESIGN.md` avant de toucher à l'interface

`DESIGN.md` (racine) fixe les règles de design, la matrice profil × niveau
(débutant / amateur / technique), l'état écran par écran (fait / à faire), les
décisions en attente et la procédure de test en local avec le vrai backend. Le
niveau d'affichage doit changer réellement chaque écran, pour chaque type de
compte : ne pas contourner `src/lib/overviewLevels.ts`.

## Mise en ligne : lire `MISE_EN_LIGNE.md`

`MISE_EN_LIGNE.md` (racine) dit quel projet Vercel (`nouankany-staging-frontend`) et quel service Render
(`nouankany-staging-backend-bm9s`) sont les bons, l'ordre de déploiement (Lambda, migrations, backend, puis frontend),
CORS, la création des données de démonstration et les tests à faire.

## Faire tourner les deux en local

- Frontend : `npm run dev` → `http://localhost:5173`, lit
  `VITE_API_BASE_URL` depuis `.env.development` (actuellement
  `http://localhost:8001`).
- Backend : voir `README.md` de ce dépôt (section "Lancement") pour la
  commande complète : nécessite `DATABASE_URL` (PostgreSQL) et `JWT_SECRET`
  en variables d'environnement, **aucun des deux n'est dans
  `backend/.env`** (volontaire, ce sont des secrets). `PORT=8001` doit être
  passé explicitement : sans lui, `backend/main.py` démarre par défaut sur
  **8000**, qui ne correspond à rien de ce dépôt côté frontend et peut aussi
  entrer en collision avec un tout autre service déjà présent sur la machine
  sur ce port : vérifier `ss -ltnp | grep 8000` avant de supposer que ce qui
  écoute dessus est ce backend.
- Comptes de démo : `python backend/scripts/seed_demo.py --with-alert --with-history`
  (voir `README.md`).
- Base locale : conteneur Docker PostgreSQL du projet (port 5434). Si le
  backend ne peut pas se connecter, demander le `DATABASE_URL` local à
  l'utilisateur plutôt que de deviner des identifiants.
- Mettre `ALERT_SWEEP_MINUTES=0` au backend local quand on ne veut pas que le
  balayage des alertes tourne (il envoie des emails).

## Vérification visuelle réelle

Le `README.md` notait initialement : *« le rendu dans un vrai navigateur n'a
pas pu être vérifié visuellement dans cet environnement (pas de Chrome
disponible) »*. Ce n'est plus vrai : l'extension **Claude in Chrome**
(`mcp__claude-in-chrome__*`) est disponible et c'est l'outil à utiliser pour
toute vérification visuelle/responsive/fonctionnelle réelle, à la demande
explicite de l'utilisateur.

Piège d'environnement rencontré : `mcp__claude-in-chrome__resize_window` ne
change pas réellement `window.innerWidth` de la page sur cette machine (le
gestionnaire de fenêtres ignore le resize : vérifié avec
`window.innerWidth`/`innerHeight` après resize, aucun changement). Pour tester
les breakpoints Tailwind (`lg:` = bascule nav mobile/desktop dans `NavBar` et
sidebar dans `AppLayout`), la technique qui fonctionne : injecter un
`<iframe>` de la taille voulue (ex. 390×844 pour mobile) dans la page via
`javascript_tool`, pointé sur `location.origin`, positionné en `(0,0)`, les
media queries répondent à la largeur de l'iframe, pas à celle de la fenêtre
OS, et le `computer` tool peut cliquer/scroller dedans normalement puisqu'il
opère en coordonnées écran réelles. Ne pas reperdre de temps à retenter
`resize_window` seul sur cette machine.

## zustand : ne jamais sélectionner une méthode du store pour en dériver une valeur

Piège trouvé dans `levelStore.ts` (déjà présent avant l'introduction du
niveau réellement fonctionnel le 2026-08-29, donc ancien) :
`useLevelStore((s) => s.getLevel)` puis `getLevel(profile)` **ne re-render
jamais** quand `levelByProfile` change : `getLevel` est une référence de
fonction stable définie une fois dans le store, zustand ne voit "aucun
changement" à cette sélection même quand l'état sous-jacent change. Le clic
sur une pastille de niveau persistait bien en localStorage mais rien ne se
mettait à jour à l'écran avant un rechargement complet de la page (repéré en
cliquant via `computer` sur un vrai bouton et en comparant l'état avant/après
sans reload : `aria-pressed` ne bougeait pas, mais `localStorage` si).
Utiliser `useLevel(profile)` (exporté par `levelStore.ts`) à la place, qui
sélectionne la valeur résolue elle-même. Règle générale : dans un sélecteur
zustand, toujours retourner la donnée dont dépend le rendu, jamais une
fonction qu'il faudra encore appeler après coup.

## Défilement dans un iframe (local seulement)

Le `computer` tool (`scroll`) n'arrive pas à faire défiler le contenu d'un iframe injecté (technique ci-dessus) :
l'événement wheel ne se propage pas dedans. Utiliser `f.contentWindow.scrollTo(0, y)` via `javascript_tool` ; ça déclenche
les breakpoints et le rendu paresseux, seul le *comportement* de défilement natif (défilement doux, en-tête collant) n'est
pas testé par ce biais.

**Sur le site en ligne, l'iframe est refusée** (en-tête `X-Frame-Options: DENY` de `vercel.json`) : ouvrir une popup par un
vrai clic et mesurer par script. La technique de l'iframe ne vaut qu'avec le site lancé en local.

## Autres pièges déjà documentés dans README.md (rappel, pas de détail ici)

- Les routes `/api/anomaly`, `/api/chat`, `/api/facturation` et `/api/v1/ml/detect-anomaly` n'existent plus (supprimées
  le 2026-10-08) : la détection passe par `/api/recommend` (diagnostic par mesure), l'assistant par
  `/api/v1/assistant/chat`, la facturation par `/api/v1/billing`.
- Ne jamais inventer une donnée : pas de donnée réelle disponible →
  `MetricState` en état vide (voir `fetchActionPlan`/`fetchResolutions`), pas
  une valeur bouchée.
- Toute nouvelle donnée affichée porte un badge de provenance
  (`estimé`/`synthétique`/`télémétrie système`/`mesuré`), jamais codé en dur.
- `backend/.env` (dans l'autre dépôt) n'est plus suivi par git depuis le
  2026-10-08 ; les anciennes clés de son historique ne servent plus.

## Lot front du 2026-11-15 (S-13, S-15, S-16, S-46)

- `vercel.json` : `/assets/*` en `Cache-Control: public, max-age=31536000, immutable` (fichiers hachés). Logo servi en `/logo.webp` (256 px) ; `logo.png` ne sert plus que d'icône d'onglet (64 px). Photos de `public/images/profiles/` en WebP.
- Tuiles de la vue d'ensemble (`src/api/kpis.ts`) : la provenance suit l'origine des relevés lue sur `/api/v1/consumption` (mesure, déclaré, démonstration, simulation) ; mélange : la moins sûre l'emporte ; origine inconnue : « synthétique ». Libellé « Puissance en ce moment ».
- Un gain en FCFA est affiché avec « ordre de grandeur » (`ImpactFigure`). Les pourcentages et les textes par famille viennent du moteur backend : à corriger là-bas (S-16).
- `MetricState` accepte `emptyAction` (lien dans l'état vide) ; `addEquipmentAction(profile)` dans `navConfig.ts`.
- **Menus resserrés (2026-11-15, S-14)** : au plus dix entrées visibles par profil (Ménage 8, PME 9, Industrie 9, Admin 10, Technicien 3). Les pages marquées `under` dans `src/lib/navConfig.ts` n'ont pas d'entrée propre : elles s'ouvrent depuis leur page parente, via la rangée « Pages liées » (`components/layout/RelatedPages.tsx`, montée dans `AppLayout`), et la barre latérale surligne le parent. Aucune route supprimée (le test `importsEtMenuMenage.test.tsx` garde la liste des routes d'avant). Décision du propriétaire : en cas de contradiction avec une ancienne décision, retenir le meilleur choix ; « Abonnement » et « Facture prévue » du Ménage (mis dans le menu le 2026-10-21 parce qu'introuvables) sont donc rangés sous « Mes factures » et « Ma consommation ». Tests réécrits pour ce contrat : `importsEtMenuMenage`, `pagesLiees`, `premiersPas`, `boitierDashboard`, `filAriane`, `landingLinks`.
- **Prix moyen** : la landing affiche la série annuelle officielle 71 → 83 FCFA/kWh HT (Direction générale de l'Économie), plus « 79 → 87 » ni « 73 → 87 » (mélange de tarifs de presse). La carte Industrie n'a plus « Essayer gratuitement » (compte vide) : seulement « Demander un audit ».

## Lot front du 2026-11-15, suite (S-03, S-20, S-21, S-26, S-27, performance, accessibilité)

- S-26 : `logout()` (`sessionStore.ts`) appelle `POST /api/auth/logout` avec le jeton de renouvellement, sans attendre ni bloquer ; la route existe côté API (PR backend #160).
- S-20 : `Session.isTrial` vient de `trial_active` (essai en cours), plus de `is_trial` (vrai à vie).
- S-27 : la fiche client admin n'a plus de champ mot de passe ; le serveur envoie un lien au titulaire, erreur 503 si le mailer n'est pas configuré.
- S-21 : `OwnerOnly`/`useCanDelete` (`components/ui/OwnerOnly.tsx`) masquent les suppressions pour un membre PME/Industrie (profil sans `isTeamOwner`). Le serveur ne refuse (403) aujourd'hui que site, facture et machine ; boîtier, compteur, recharge et item de plan sont masqués d'avance, à faire suivre côté API.
- S-03 : « ×1,65 » de l'accueil = 94,21 / 57,17 (grille ANARE-CI 2019, moyenne tension). Le chiffre « 79 → 87 » reste à trancher par le propriétaire (73 ou 79).
- Visualiseur 3D (`BoitierViewer`) : three.js et le GLB (2,18 Mo) ne se chargent qu'à l'approche du viewport, jamais sous 768 px, avec `prefers-reduced-data` ou `saveData`. En-têtes de cache de `/images`, `/models`, `/logo.*` : `max-age=86400, stale-while-revalidate=604800` (fichiers non hachés).
- Accessibilité : bordure des champs `text-tertiary` (#6e6e64, 5,15:1 sur blanc, ancien 1,31:1), erreurs de champ en `role="alert"`, onglets Connexion/Inscription en `aria-pressed`. Reste : les autres contrôles (listes déroulantes, etc.) non revus.
