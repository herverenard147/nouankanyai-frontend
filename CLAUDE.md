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
