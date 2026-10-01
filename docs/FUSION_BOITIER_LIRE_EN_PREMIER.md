# Fusion des PR du boîtier : à lire en premier (document prioritaire)

Écrit le 1er octobre 2026 par une session Claude Code **dans le cloud**. Destiné à **Claude Code en local**, qui fusionne et déploie.
Il couvre les deux PR ouvertes, les erreurs rencontrées et l'ordre exact de fusion. L'hébergement est **Render** (Fly.io n'est plus utilisé).

## Règle n° 1 : ne rien faire avant d'avoir validé

Tout ce qui suit a été écrit par une autre session, qui n'a **pas accès à votre machine, à Render, ni à la base de production**.
Avant la moindre commande de fusion ou de déploiement :

1. Lisez la section 2 et **exécutez chaque vérification**. Une affirmation qui ne se vérifie pas est fausse jusqu'à preuve du contraire.
2. Si une vérification échoue, **arrêtez-vous et dites-le à l'utilisateur** : ne « réparez » pas pour faire coller ce document.
3. Ce document ne vous autorise ni à pousser sur `main`, ni à forcer un push, ni à toucher la base de production sans que l'utilisateur l'ait dit dans cette conversation.
4. Si le dépôt a un `CLAUDE.md` (c'est le cas des deux), ses garde-fous passent avant ce document.

## 1. Ce qui a été fait

| | Backend | Frontend |
| --- | --- | --- |
| Dépôt | `herverenard147/NouanKanyAI` | `herverenard147/nouankanyai-frontend` |
| PR (brouillon) | [#4](https://github.com/herverenard147/NouanKanyAI/pull/4) | [#4](https://github.com/herverenard147/nouankanyai-frontend/pull/4) |
| Branche | `claude/boitier-backend` | `claude/nouankany-design-propositions-5o9kyw` |
| Contenu | Boîtier vocal : appairage, état par mesure, conversation, extinction simulée, **demande de boîtier (35 000 FCFA)**, état lu depuis le site, volet admin | Pages `/app/boitier`, `/app/boitier/:id`, `/app/admin/boitiers` ; la page publique `/le-boitier` est déjà sur `main` (PR frontend #3) |
| Tests ajoutés | `tests/test_boitier_*.py` (65 tests) | `src/test/boitierDashboard.test.tsx` (10 tests) |

Parcours produit voulu par le propriétaire : un compte n'a **aucun boîtier** au départ → il en **demande** un (prix affiché) → il le reçoit → il **demande son code** de connexion et le saisit sur le boîtier → liste → fiche de chaque boîtier. L'admin voit les demandes à livrer et les marque « livré ».

**Le frontend dépend du backend** : sans les nouvelles routes déployées, les pages Boîtier affichent « Indisponible ».

## 2. Vérifications à faire avant d'agir

Chaque ligne : l'affirmation, la commande, le résultat attendu.

| # | Affirmation | Commande (depuis le dépôt concerné) | Attendu |
| --- | --- | --- | --- |
| V1 | La PR backend fusionne sans conflit avec `main` | `git fetch origin && git checkout --detach origin/main && git merge --no-commit --no-ff origin/claude/boitier-backend; git merge --abort` | « Automatic merge went well » (au 1er octobre : `main` a 2 commits d'avance sur la branche, Copilot réel et format texte brut) |
| V2 | Idem côté frontend | même commande avec `origin/claude/nouankany-design-propositions-5o9kyw` | fusion automatique réussie (`main` a 3 commits d'avance) |
| V3 | Après fusion, les tests backend passent, sauf un échec déjà présent sur `main` | voir 3.2, sur une base **locale jetable** | 241 réussis, 1 échec : `test_platform_predictions_and_consumption_show_real_per_user_data`, **le même échec sur `main` seul** (cause : section 5, point B) |
| V4 | Après fusion, le frontend compile et ses tests passent | `npx tsc --noEmit -p . && npx vitest run --exclude src/test/backendIntegration.smoke.test.ts` | aucune erreur ; 67 tests réussis |
| V5 | Le prix vient du backend et vaut 35 000 par défaut | `grep -n BOITIER_PRICE_FCFA backend/app/api/v1/boitier/router.py` | `os.environ.get("BOITIER_PRICE_FCFA", "35000")` |
| V6 | La migration SQL du boîtier est idempotente | la rejouer deux fois sur une base jetable (3.2) | aucune erreur |
| V7 | Le jeton du boîtier réutilise `JWT_SECRET` | `grep -n JWT_SECRET backend/app/boitier/auth.py` | `jwt.encode(..., user_auth.JWT_SECRET, ...)` : pas de nouveau secret à créer |
| V8 | La branche n'a embarqué aucun fichier parasite | `git diff --name-only origin/main...origin/claude/boitier-backend` | uniquement `backend/app/boitier/`, `backend/app/api/v1/boitier/`, schémas, tests, `models_db.py`, `main.py`, `trail.py`, `journal/router.py`, `README.md`, `migrations/`, `docs/` : **aucun** `__pycache__`, `.env` ni clé |
| V9 | L'ancien bug de migration existe réellement | `grep -n "is_suspended" backend/main.py` | des `ALTER TABLE users ADD COLUMN IF NOT EXISTS ...` dans cette branche, absents de `main` |

**Ne lancez jamais la suite de tests contre la base de production ni de staging.** Les tests créent des comptes, sites et machines réels (des centaines d'enregistrements « test-boitier.demo »). `DATABASE_URL` doit pointer vers une base locale jetable.

## 3. Ordre de fusion et de déploiement

Règle : **backend d'abord, frontend ensuite**. Le backend est rétrocompatible (il ajoute des tables, des colonnes et des routes) ; le frontend ne l'est pas avec un ancien backend.

### 3.1 Avant de fusionner

- Confirmez avec l'utilisateur la cible de déploiement. Le dépôt contient encore des traces de Fly.io (`backend/fly.toml`, `MISE_EN_LIGNE.md` côté frontend) et de Railway : **elles sont périmées**. `backend/../render.yaml` décrit un service Render (`nouankany-backend`, base `nouankany-db`) ; **cette session ne l'a pas vérifié** : lisez l'état réel du tableau de bord Render avec l'utilisateur (nom du service, nom de la base, URL du frontend).
- Sauvegardez la base de Render (instantané) **avant** tout déploiement qui touche le schéma.

### 3.2 Backend

```bash
cd NouanKanyAI
git fetch origin
git checkout claude/boitier-backend
git merge origin/main                     # fusion de main DANS la branche (jamais de rebase ni de force-push)

# Base locale jetable uniquement (jamais prod) :
export DATABASE_URL=postgresql://USER:MDP@127.0.0.1:5432/BASE_LOCALE_JETABLE
export JWT_SECRET=$(python3 -c "import secrets;print(secrets.token_urlsafe(48))")
export AI_MODE=mock
python -m pytest backend/tests -q         # attendu : 1 échec connu (section 5, B), le reste vert
```

Puis fusionner la PR par l'interface GitHub (« Merge », pas de squash qui perdrait l'historique des correctifs).

### 3.3 Base de données sur Render

Le démarrage du backend crée les tables neuves (`create_all`) et ajoute les colonnes manquantes (`ALTER ... IF NOT EXISTS`). Pour ne pas dépendre du seul démarrage, jouez aussi les migrations, **dans cet ordre**, sur la base Render :

```bash
psql "$DATABASE_URL" -f migrations/2026_10_01_add_users_suspension_deletion.sql
psql "$DATABASE_URL" -f migrations/2026_10_01_add_boitier.sql
```

Les deux sont idempotentes. La première corrige les erreurs 500 « column users.is_suspended does not exist » (cause : section 4, ligne 1).

### 3.4 Variables d'environnement Render (backend)

Toutes facultatives, sauf rappel :

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `BOITIER_PRICE_FCFA` | `35000` | Prix d'un boîtier, figé à chaque demande |
| `BOITIER_APPROACH_RATIO` | `0.85` | Part du seuil à partir de laquelle la lumière passe à l'orange |
| `BOITIER_RISING_FLOOR_RATIO` | `0.7` | Plancher de la détection d'une montée (3 relevés croissants) |
| `BOITIER_CONFIRM_SECONDS` | `30` | Durée de validité de la confirmation d'une extinction |
| `BOITIER_STORE_TRANSCRIPTS` | `0` | `1` seulement avec une base légale : les phrases dites sont des données personnelles |
| `ALLOWED_ORIGINS` / `FRONTEND_URL` | | Doit contenir l'adresse exacte du frontend déployé (garde-fou 6 du CLAUDE.md) |
| `AI_MODE` | | `live` en production. Sinon le boîtier répond avec des réponses simulées pour les questions ouvertes |

### 3.5 Frontend

```bash
cd nouankanyai-frontend
git fetch origin
git checkout claude/nouankany-design-propositions-5o9kyw
git merge origin/main
npx tsc --noEmit -p . && npx vitest run --exclude src/test/backendIntegration.smoke.test.ts
```

Fusionner la PR, **après** le déploiement du backend. Si le frontend est un site statique Render, la règle **Rewrite `/*` → `/index.html`** doit exister (déjà documentée dans le `CLAUDE.md` du frontend) : sans elle, `/app/boitier/<id>` renvoie 404 au rafraîchissement.

## 4. Erreurs rencontrées pendant ce travail (et ce qu'il en reste)

| # | Erreur | Cause | Ce qui a été fait | À savoir en fusionnant |
| --- | --- | --- | --- | --- |
| 1 | Tests : `column users.is_suspended does not exist` | `main` n'a **pas** de migration automatique des colonnes `users.is_suspended / is_deleted / deleted_at` (seul le fichier SQL existe, à jouer à la main) | `ALTER ... IF NOT EXISTS` ajoutés au démarrage dans cette branche + fichier SQL du boîtier | Si la base Render n'a pas ces colonnes, **la production plante déjà** sur les routes qui les lisent. À vérifier en premier |
| 2 | `KeyError: 'boitier.update'` à l'écriture de l'Audit | Le dictionnaire `ACTIONS` de `trail.py` n'avait pas l'entrée (un remplacement automatique de texte n'avait rien trouvé, sans erreur) | Entrées ajoutées : `boitier.create / pair / update / revoke / command / request / request_cancel / delivered` | Toute nouvelle action d'audit doit être déclarée dans `ACTIONS` |
| 3 | Un boîtier ne voyait aucune machine | Les machines « non associées » (sans site) étaient invisibles d'un boîtier rattaché à un site | Règle : une machine sans site appartient au seul site du compte ; sinon le boîtier le signale (`unassigned_machines`) | À tester avec un compte réel ayant des machines sans site |
| 4 | Test d'intention en échec (« Que me conseilles-tu ? ») | Racines de mots manquantes dans le routeur d'intentions | Ajout de `conseilles`, `conseils`, `recommandes`, `economies` | |
| 5 | `package-lock.json` bruité (frontend, PR #3) | Un `npm install` avait retiré des champs `libc` | Verrou réécrit en ne gardant que les 8 paquets ajoutés ; `npm ci --dry-run` valide | Ne pas régénérer le verrou sans raison |
| 6 | **105 fichiers reformatés par erreur** (frontend) | `prettier` lancé sans configuration : doubles guillemets, points-virgules | Tout a été annulé (`git checkout`) avant commit ; seul le code voulu reste | **Le dépôt n'a pas de configuration Prettier.** Style réel : guillemets simples, sans point-virgule. N'exécutez pas Prettier sur le dépôt entier |
| 7 | Échec Vercel sur la PR backend | Le projet Vercel `nouankanyai-frontend` (`rootDirectory: frontend`) est **rattaché par erreur au dépôt backend**, qui n'a pas de dossier `frontend` | Un commentaire explicatif sur la PR. Aucun correctif de code | À faire par l'utilisateur dans Vercel : déconnecter ce projet du dépôt backend. Le bon projet est `nouankany-staging-frontend` |
| 8 | Une commande `pkill -f` a tué le shell de la session | Le motif correspondait aussi à la commande en cours | Redémarrage séparé du serveur | Ne pas utiliser `pkill -f` avec un motif présent dans sa propre ligne de commande |
| 9 | Push refusé (verrou périmé) | La branche ne portait que des commits déjà fusionnés | `--force-with-lease`, sur cette seule branche | Vous : **aucun force-push sans accord de l'utilisateur** |

## 5. Bugs déjà présents sur `main` (non causés par ces PR)

- **A. `/api/admin/alerts` renvoie 500** dès qu'un compte a une machine sans aucun relevé : `SensorReading(**...)` reçoit `None` (`main.py` ~l. 1750). Même cause pour **B**.
- **B. `test_platform_predictions_and_consumption_show_real_per_user_data` échoue sur `main` seul** : `PredictionRequest` reçoit `None` pour température, vibration et pression (`_predict_bundle_for_user`, `main.py` ~l. 1729). Piste de correctif : ignorer (ou renvoyer « pas de relevé » pour) les machines sans relevé, au lieu de valeurs vides. Non corrigé ici pour ne pas élargir la PR.
- **C. `POST /api/v1/ml/detect-anomaly` répond sans jeton.** Voir `AUDIT_ET_PLAN_AMELIORATION.md`, action 2.

## 6. Après le déploiement : contrôle

Avec un compte de test **créé exprès** (jamais un compte client) :

```bash
API=https://URL-DU-BACKEND-RENDER
curl -s $API/api/v1/boitiers/price -H "Authorization: Bearer $TOKEN"        # {"unit_price_fcfa":35000,"currency":"FCFA"}
curl -s $API/api/v1/boitiers/requests -H "Authorization: Bearer $TOKEN"     # []
```

Puis dans le navigateur : `/app/boitier` (écran vide) → « Demander un boîtier » (le prix s'affiche) → « J'ai reçu mon boîtier » → code à 8 caractères. Pour simuler le boîtier : `POST /api/v1/boitier/pair` avec `{"code": "...", "firmware_version": "0.1.0"}` (réponse : un `secret`) ; la liste montre alors « En ligne ». Côté admin : `/app/admin/boitiers` doit lister la demande et permettre « Marquer comme livré ».

Si `AI_MODE=live`, vérifiez une fois une question ouverte au boîtier (`POST /api/v1/boitier/chat`, texte hors vocabulaire connu) : `ask_llm` n'est pas couvert par les tests (ils le remplacent par un faux). Il appelle `IndustrialCopilot.ask(..., use_tools=False)`, signature **toujours présente** sur `main` après le commit « Copilot IA : outils réels ».

## 7. Retour arrière

- Backend : redéployer le commit précédent. Les tables et colonnes ajoutées sont **inoffensives** pour l'ancien code (il les ignore) ; ne les supprimez pas.
- Frontend : redéployer le commit précédent ; l'entrée « Boîtier » disparaît du menu.
- Base : restaurer l'instantané de 3.1 **seulement** si le schéma a été corrompu, jamais pour annuler un simple déploiement.

## 8. Ce qui n'est pas fait (ne pas le faire sans demande)

- Le boîtier physique n'existe pas encore : l'extinction est **simulée** (`SimulatedChannel`). Les prises connectées réelles lèvent `ControlNotConfigured`.
- Aucune demande livrée n'est exigée avant de demander un code (volontaire : comptes de test).
- Écran **Industrie** : en attente d'une décision (boîtier ou tablette).
- Démarche **ARTCI** : repoussée par le propriétaire (phase de test). Les phrases dites sont des données personnelles ; `BOITIER_STORE_TRANSCRIPTS` reste à `0`.

## 9. Invite à donner à Claude Code en local

> Lis `docs/FUSION_BOITIER_LIRE_EN_PREMIER.md`. Une autre session, sans accès à ma machine ni à Render, l'a écrit : **ne la crois pas sur parole**. Exécute d'abord chaque vérification V1 à V9 et rapporte-moi le résultat de chacune, sans rien modifier. Si l'une échoue, arrête-toi et dis-moi laquelle. Ne lance jamais les tests contre une base de production ou de staging. Ensuite, et seulement si tout est confirmé, propose-moi le plan de fusion de la section 3 et attends mon accord avant de fusionner une PR, de jouer une migration sur Render ou de pousser quoi que ce soit. Pas de force-push, pas de rebase, pas de Prettier sur tout le dépôt. L'hébergement est Render : dis-moi ce que le tableau de bord Render montre réellement (services, base, variables) avant de t'appuyer sur `render.yaml`.
