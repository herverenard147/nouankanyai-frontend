# Nouankany — mise en ligne (Vercel + Railway) et tests

Fichier destiné à Claude Code en local (qui a accès aux comptes Vercel et Railway). Lire d'abord `CLAUDE.md` puis
`DESIGN.md` (règles, matrice niveau × écran, modales, endpoints). **Ce fichier dit où mettre quoi.**

## 1. Les bons sites (à vérifier avant toute action : cette session n'a pas pu les lire)

La session qui a préparé ce travail n'avait accès à **aucun** projet Nouankany sur Vercel ni Railway (les comptes
visibles étaient d'autres projets). Les correspondances ci-dessous viennent des commentaires du bot Vercel sur les PR et
des fichiers du dépôt : **les confirmer** dans les tableaux de bord avant de fusionner.

| Élément | Où | Source |
|---|---|---|
| Frontend (dépôt `herverenard147/nouankanyai-frontend`) | Projet Vercel **`nouankany-staging-frontend`** (`prj_rErtwyrGCds7NpASipCg8I039F2D`, équipe `team_C4v7fqf8HYLVJvCLcS42OvQm`), répertoire racine = racine du dépôt. Site : https://nouankany-staging-frontend.vercel.app/ ; aperçu de la branche : `nouankany-staging-frontend-git-ca6bcf-herverenard147s-projects.vercel.app` | commentaires Vercel de la PR frontend #1 |
| Backend (dépôt `herverenard147/NouanKanyAI`) | Service Railway **`nouankany-staging-backend`**, URL https://nouankany-staging-backend-production.up.railway.app | `.env.production` du frontend |
| **À débrancher** | Projet Vercel **`nouankanyai-frontend`** (`prj_LOSUC3bvmeRCbvZWg6egtEZos6BA`, répertoire racine `frontend`) est relié **par erreur** au dépôt **backend** : il échoue sur chaque PR backend (dossier `frontend` inexistant). Le déconnecter de `NouanKanyAI` (ou le supprimer s'il ne sert à rien ; demander avant de supprimer). | check Vercel rouge sur les PR backend |

Le frontend lit `VITE_API_BASE_URL` (committé dans `.env.production` : l'URL Railway ci-dessus) ; `vercel.json` réécrit
toutes les routes vers `/index.html`. Aucun secret dans le dépôt.

**Il n'existe, à notre connaissance, qu'un environnement « staging ».** Ne pas inventer de production : si le propriétaire
veut une production séparée, la lui demander.

## 2. Ordre de mise en ligne (⚠ = demander confirmation au propriétaire avant)

1. **Backend d'abord** (le frontend déployé appelle les nouveaux endpoints `/api/v1/audit/*` et `/api/v1/plan/*`).
   - PR `herverenard147/NouanKanyAI#1` (script de démo) puis `#2` (endpoints, empilée sur `#1`) ; vérifier `pytest backend/tests`
     (150 passent) avec un PostgreSQL de test.
   - ⚠ Fusionner `#1` puis `#2`. Quelle branche Railway déploie-t-elle ? (`main`, ou `feature/merge-steph-ml-subsystem` d'où le
     frontend a été branché à l'origine) : **vérifier dans Railway → service → Settings → Source** et fusionner dans celle-là.
   - Au démarrage, `Base.metadata.create_all` crée seul `audit_events`, `action_plan_items`, `resolution_records` : pas de
     migration, aucune donnée existante touchée.
   - **CORS** : le backend n'autorise que `FRONTEND_URL` + `ALLOWED_ORIGINS` (voir `CLAUDE.md` du backend, règle 6). Vérifier que
     `https://nouankany-staging-frontend.vercel.app` y figure (sinon l'ajouter dans les variables Railway) ; les aperçus de PR
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
- Parcours réels de bout en bout avec les 4 comptes, aux 3 niveaux, à 390, 768, 1024 et 1440 px (aucun défilement horizontal,
  barre latérale immobile, tiroir mobile) ; avertissement React « deux enfants avec la même clé » vu sur le compte PME de test
  (14 machines de test) : trouver le composant et corriger.
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
