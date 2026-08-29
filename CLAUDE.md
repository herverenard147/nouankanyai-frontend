# Nouankany — Instructions pour Claude Code (frontend)

Ce fichier est chargé automatiquement par Claude Code. Il documente des faits
et pièges déjà rencontrés sur ce dépôt — les revérifier coûte du temps, les
ignorer réintroduit des régressions déjà vues une fois. Le `README.md` est la
référence complète (structure, couche d'adaptation `src/api/`, comptes de
démo, mappings notables) : ne le duplique pas ici, ce fichier ne couvre que ce
qui n'y est pas ou ce qui a changé depuis.

## Ce dépôt est un frontend seul, branché sur un backend séparé

Le backend réel vit dans `../NouanKanyAI/` (dépôt git distinct,
`herverenard147/NouanKanyAI`, branche `feature/merge-steph-ml-subsystem`). Ce
dépôt-ci (`NouanKanyAI Landing et Dashboard/`) n'a **aucun commit** à ce jour
— tout est en `Fichiers non suivis`. Ne pas supposer un historique git.

## Faire tourner les deux en local

- Frontend : `npm run dev` → `http://localhost:5173`, lit
  `VITE_API_BASE_URL` depuis `.env.development` (actuellement
  `http://localhost:8001`).
- Backend : voir `README.md` de ce dépôt (section "Lancement") pour la
  commande complète — nécessite `DATABASE_URL` (PostgreSQL) et `JWT_SECRET`
  en variables d'environnement, **aucun des deux n'est dans
  `backend/.env`** (volontaire, ce sont des secrets). `PORT=8001` doit être
  passé explicitement : sans lui, `backend/main.py` démarre par défaut sur
  **8000**, qui ne correspond à rien de ce dépôt côté frontend et peut aussi
  entrer en collision avec un tout autre service déjà présent sur la machine
  sur ce port — vérifier `ss -ltnp | grep 8000` avant de supposer que ce qui
  écoute dessus est ce backend.
- Comptes de démo : pas seedés automatiquement, à créer via `POST
  /api/auth/signup` (ou le formulaire `/login` → « Créer un compte ») — voir
  la liste dans `README.md`.
- Aucun compte de service Postgres local n'était pré-configuré au moment de
  la rédaction (pas de rôle correspondant à l'utilisateur système) : si
  `psql`/le backend ne peuvent pas se connecter, demander à l'utilisateur le
  `DATABASE_URL` local plutôt que de deviner des identifiants.

## Vérification visuelle réelle

Le `README.md` notait initialement : *« le rendu dans un vrai navigateur n'a
pas pu être vérifié visuellement dans cet environnement (pas de Chrome
disponible) »*. Ce n'est plus vrai — l'extension **Claude in Chrome**
(`mcp__claude-in-chrome__*`) est disponible et c'est l'outil à utiliser pour
toute vérification visuelle/responsive/fonctionnelle réelle, à la demande
explicite de l'utilisateur.

Piège d'environnement rencontré : `mcp__claude-in-chrome__resize_window` ne
change pas réellement `window.innerWidth` de la page sur cette machine (le
gestionnaire de fenêtres ignore le resize — vérifié avec
`window.innerWidth`/`innerHeight` après resize, aucun changement). Pour tester
les breakpoints Tailwind (`lg:` = bascule nav mobile/desktop dans `NavBar` et
sidebar dans `AppLayout`), la technique qui fonctionne : injecter un
`<iframe>` de la taille voulue (ex. 390×844 pour mobile) dans la page via
`javascript_tool`, pointé sur `location.origin`, positionné en `(0,0)` — les
media queries répondent à la largeur de l'iframe, pas à celle de la fenêtre
OS, et le `computer` tool peut cliquer/scroller dedans normalement puisqu'il
opère en coordonnées écran réelles. Ne pas reperdre de temps à retenter
`resize_window` seul sur cette machine.

## zustand : ne jamais sélectionner une méthode du store pour en dériver une valeur

Piège trouvé dans `levelStore.ts` (déjà présent avant l'introduction du
niveau réellement fonctionnel le 2026-08-29, donc ancien) :
`useLevelStore((s) => s.getLevel)` puis `getLevel(profile)` **ne re-render
jamais** quand `levelByProfile` change — `getLevel` est une référence de
fonction stable définie une fois dans le store, zustand ne voit "aucun
changement" à cette sélection même quand l'état sous-jacent change. Le clic
sur une pastille de niveau persistait bien en localStorage mais rien ne se
mettait à jour à l'écran avant un rechargement complet de la page (repéré en
cliquant via `computer` sur un vrai bouton et en comparant l'état avant/après
sans reload — `aria-pressed` ne bougeait pas, mais `localStorage` si).
Utiliser `useLevel(profile)` (exporté par `levelStore.ts`) à la place, qui
sélectionne la valeur résolue elle-même. Règle générale : dans un sélecteur
zustand, toujours retourner la donnée dont dépend le rendu, jamais une
fonction qu'il faudra encore appeler après coup.

## Déploiement Render : le scroll de scroll via `computer` ne marche pas dans un iframe, et `_redirects` est ignoré

Deux pièges rencontrés en déployant `nouankany-staging-frontend` (static site
Render, repo `herverenard147/nouankanyai-frontend`) :

1. Le `computer` tool (`scroll`) n'arrive pas à faire défiler le contenu d'un
   iframe injecté (technique ci-dessus) — l'événement wheel ne se propage pas
   dedans. Utiliser `f.contentWindow.scrollTo(0, y)` via `javascript_tool` à
   la place ; ça déclenche correctement les breakpoints/lazy-render, seul le
   *comportement* de scroll natif (smooth-scroll, sticky header au scroll)
   n'est pas testé par ce biais-là.
2. Un fichier `public/_redirects` (convention Netlify, `/*  /index.html  200`)
   **est bien déployé tel quel** par Render (accessible à `/​_redirects`) mais
   **n'est pas interprété** — Render ignore ce fichier. Sans rewrite
   explicite, toute route client-side (`/demander-un-audit`, `/app/...`) qui
   n'est pas `/` renvoie 404 en accès direct/refresh. Il faut configurer la
   règle manuellement : Dashboard Render → service static site → onglet
   **Redirects/Rewrites** → Source `/*`, Destination `/index.html`, Action
   **Rewrite** (pas *Redirect*, qui changerait l'URL vers `/`). Le `<select>`
   de cet écran ne répond pas de façon fiable à un clic simulé
   (`computer.left_click`) sur l'option visible — utiliser
   `form_input(ref, "Rewrite")` après `find` sur le combobox, plus fiable.
   Le fichier `public/_redirects` reste inoffensif à garder dans le repo
   (utile si migration vers Netlify) mais ne dispense pas de cette règle côté
   Render.

## Autres pièges déjà documentés dans README.md (rappel, pas de détail ici)

- Ne pas brancher `POST /api/anomaly` (legacy, bug `numpy.bool_` connu côté
  backend) — utiliser `POST /api/v1/ml/detect-anomaly`.
- Ne jamais inventer une donnée : pas de donnée réelle disponible →
  `MetricState` en état vide (voir `fetchActionPlan`/`fetchResolutions`), pas
  une valeur bouchée.
- Toute nouvelle donnée affichée porte un badge de provenance
  (`estimé`/`synthétique`/`télémétrie système`/`mesuré`), jamais codé en dur.
- `backend/.env` (dans l'autre dépôt) contient des clés déjà commitées avant
  `.gitignore` — hors périmètre de ce dépôt, ne pas tenter de les faire
  tourner depuis ici.
