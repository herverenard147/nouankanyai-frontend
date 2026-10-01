# Nouankany — mise en ligne (Vercel + Railway) et tests

Fichier destiné à Claude Code en local (qui a accès aux comptes Vercel et Railway). Lire d'abord `CLAUDE.md` puis
`DESIGN.md` (règles, matrice niveau × écran, modales, endpoints). **Ce fichier dit où mettre quoi.**

## 1. Les bons sites

Claude Code en local **connaît les vrais liens** (projets Vercel, services Railway, URL, branches déployées, variables) : c'est
**lui qui fait foi**, pas ce fichier. Les repères ci-dessous viennent des commentaires du bot Vercel sur les PR et du dépôt ; en cas
de différence avec ce que tu vois dans Vercel / Railway, **corrige ce tableau** et continue avec la vraie valeur.

| Élément | Repère |
|---|---|
| Frontend (`herverenard147/nouankanyai-frontend`) | projet Vercel `nouankany-staging-frontend`, racine du dépôt |
| Backend (`herverenard147/NouanKanyAI`) | **app Fly.io `nouankany-staging-backend`** (`nouankany-staging-backend.fly.dev`, région `cdg`), `backend/Dockerfile` + `backend/fly.toml`. Le frontend l'appelle via `VITE_API_BASE_URL` (`.env.production`) |
| Base de données | **Neon** (projet `neondb`, région `eu-central-1`), `DATABASE_URL` réglée comme secret Fly |
| À débrancher | le projet Vercel `nouankanyai-frontend` (répertoire racine `frontend`) est relié **par erreur au dépôt backend** : il est rouge sur chaque PR backend |

**Migration du 2026-10-01 (Railway → Fly.io + Neon)** : le crédit d'essai Railway (compte `hervegeorges002@gmail.com`, projet
`nouankanyai`) a été épuisé pendant cette session — passerelle publique en 502 sur les deux services (`nouankanyai-backend` ET
`nouankany-staging-backend`), confirmé non lié à une panne Railway (statut officiel UP) via accès direct par proxy TCP. Le
staging a été recréé sur Fly.io (DB Neon neuve, vide — pas de reprise des données Railway). Le backend `main` (prod,
`nouankanyai-backend`) reste sur Railway et n'a pas été vérifié/migré (hors périmètre de cette session, à surveiller : même
compte, même risque d'épuisement de crédit).

`vercel.json` réécrit toutes les routes vers `/index.html`. Aucun secret dans le dépôt.

## 2. Ordre de mise en ligne (⚠ = demander confirmation au propriétaire avant)

1. **Backend d'abord** (le frontend déployé appelle les nouveaux endpoints `/api/v1/audit/*` et `/api/v1/plan/*`).
   - PR `herverenard147/NouanKanyAI#1` (script de démo) puis `#2` (endpoints, empilée sur `#1`) ; vérifier `pytest backend/tests`
     (150 passent) avec un PostgreSQL de test.
   - ⚠ Fusionner `#1` puis `#2`. Quelle branche Railway déploie-t-elle ? (`main`, ou `feature/merge-steph-ml-subsystem` d'où le
     frontend a été branché à l'origine) : **vérifier dans Railway → service → Settings → Source** et fusionner dans celle-là.
   - Au démarrage, `Base.metadata.create_all` crée seul `audit_events`, `action_plan_items`, `resolution_records` : pas de
     migration, aucune donnée existante touchée.
   - **CORS** : le backend n'autorise que `FRONTEND_URL` + `ALLOWED_ORIGINS` (voir `CLAUDE.md` du backend, règle 6). Vérifier que
     le domaine public du site Vercel du frontend y figure (sinon l'ajouter dans les variables Railway) ; les aperçus de PR
     (`*.vercel.app`) n'y sont pas : à ajouter seulement si on veut tester les aperçus contre ce backend.
   - Variables obligatoires déjà en place côté Railway : `DATABASE_URL`, `JWT_SECRET` (ne jamais les écrire dans le dépôt ni dans
     un message). `SUPERADMIN_EMAIL` pour le compte admin.
   - Contrôle : `GET /` répond ; avec un vrai compte, `GET /api/v1/audit/events` répond 200 (et 401 sans jeton).
2. **Frontend** : branche `claude/nouankany-design-propositions-5o9kyw`, PR #1 (brouillon). Faire le câblage restant (§4), tests
   verts, **puis** ⚠ la sortir du brouillon et la fusionner ; Vercel redéploie `nouankany-staging-frontend`.
3. **Débrancher** le projet Vercel `nouankanyai-frontend` du dépôt backend (§1).
4. Contrôler l'URL publique (§5).

## 3. Créer les données (comptes et historique)

Tout passe par l'API : **aucun accès direct à la base**, aucun dump (il contient des empreintes de mots de passe).

```bash
# Local (PostgreSQL requis) : backend sur 8001, frontend sur 5173
DATABASE_URL=postgresql://… JWT_SECRET=… SUPERADMIN_EMAIL=admin@nouankany.demo \
FRONTEND_URL=http://localhost:5173 AI_MODE=mock PORT=8001 python backend/main.py
python backend/scripts/seed_demo.py --with-alert --with-history   # http://localhost:8001 par défaut
```

- Crée les 4 comptes (mot de passe `demo1234`, public) : `aicha@menage.demo` (Ménage), `contact@boulangerie-awale.demo` (PME),
  `exploitation@yopougon-l2.demo` (Industrie), `admin@nouankany.demo` (Admin, superadmin si `SUPERADMIN_EMAIL` était défini
  **avant** l'inscription) ; leurs sites et machines ; avec `--with-alert` une alerte sur l'Industrie ; avec `--with-history` les
  factures, un membre d'équipe par compte pro, le plan d'action et deux vérifications. Idempotent (relançable).
- Le script **refuse un hôte non local** sans `--allow-remote`. **Le lancer sur Railway (staging) seulement si le propriétaire
  le demande explicitement** (comptes à mot de passe public sur un site en ligne) ; **jamais sur une vraie production**.
- Ces données sont des **données de test** (relevés simulés par le backend) : elles ne doivent pas être présentées comme réelles.
- L'Audit n'est pas rétro-rempli : il ne contient que les actions faites après le déploiement.

## 4. Reste à faire côté frontend (le gros est fait, voir `DESIGN.md` §9)

Fait dans le code : Audit, Plan d'action, modales (ajout / modification + validation / suppression + validation), vues
d'ensemble des 4 profils, règles de niveau (`lib/overviewLevels.ts`, `auditLevels.ts`, `planLevels.ts`), provenance sobre, carte
d'alerte sobre, graphique horaire à une barre, assistant plus bas, espace fine insécable, encadré « Vos appareils ».

À vérifier / finir :
- Parcours réels de bout en bout avec les 4 comptes, aux 3 niveaux, à 390, 768, 1024 et 1440 px (barre latérale immobile,
  tiroir mobile). Déjà vérifié en local avec Playwright : toutes les routes des 4 profils chargent sans erreur ; modales
  (modifier + validation, supprimer + validation), plan d'action, audit (colonnes par niveau, export CSV), factures, seuils,
  profil et équipe fonctionnent ; aucun défilement horizontal à 390 / 1024 px sur Machines, Équipements et la validation. Deux défauts
  trouvés et corrigés (colonne « Actions » qui débordait ; liste de champs de facture qui gardait l'ancienne valeur après
  modification). Reste à refaire sur le site déployé.
- Pages restées à l'ancien style (cartes) : Alertes, Conseils, Recommandations, Journal, Commission (`ReportsPage`),
  Admin (Santé, Modèles, Utilisateurs, Demandes d'audit) : les passer au langage visuel de `DESIGN.md` §2 (filets, coins droits).
- Retirer `@fontsource/ibm-plex-mono` de `package.json` (import déjà retiré) et régénérer le lockfile.
- Supprimer ce qui n'est plus utilisé (`KpiGrid`, `TariffSection` dans les vues d'ensemble, `ActionPlanList`, `ResolutionsList`,
  `NavEntry.icon` lettres) si rien ne les référence.
- Le changement de rôle utilisateur (Admin) n'écrit pas dans l'Audit côté backend : à instrumenter si souhaité.

## 5. Tests à faire après la mise en ligne

1. Backend : `pytest backend/tests` ; `curl` de `/` et de `/api/v1/audit/events` (401 sans jeton).
2. Frontend en local contre le backend local : `npx tsc -b`, `npx oxlint src`, `npm run test` (le test d'intégration exige le
   backend + `seed_demo.py --with-alert --with-history`).
3. Site déployé : landing ; connexion des 4 comptes (s'ils ont été créés) ; pour chacun, toutes les entrées de la navigation ;
   Industrie → Machines → Modifier (modale de validation avant → après) et Supprimer (saisie du nom) ; Plan d'action (ajouter,
   modifier + validation, retirer + validation) ; Audit aux 3 niveaux (colonnes) et export CSV au niveau technique ; Factures
   (ajouter, modifier + validation, supprimer + validation) ; Paramètres (seuils, profil, équipe).
4. Console du navigateur et requêtes réseau : aucune erreur (CORS compris).
5. Rendre compte : ce qui est en ligne (URL), ce qui a été testé, ce qui reste, tout écart avec les maquettes
   (canvas https://claude.ai/artifact/WnHgKLuo5DF81qHQ7XucGe).

## 6. Décisions déjà prises (ne pas les rouvrir)

10 % de commission par défaut mais la landing garde « Structure définie lors de l'audit » ; libellé « Gratuit pour commencer »
retiré ; le Ménage n'est pas gratuit (il paie selon ses économies) ; « capteur » permis quand il désigne un élément précis ;
aucune mention du modèle côté client, uniquement dans le volet Admin (page « Modèles & observabilité » et nom du modèle sur la
Prédiction de l'Admin) ; le Journal est conservé (ce n'est pas un audit).
