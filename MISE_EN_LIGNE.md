# Nouankany : mise en ligne (backend Render, frontend Vercel) et tests

Fichier destiné à Claude Code en local, qui a accès aux comptes. Lire d'abord `CLAUDE.md`, puis `DESIGN.md`. Les noms
ci-dessous font foi jusqu'à preuve du contraire : en cas de différence avec ce que montrent Render ou Vercel, **corriger ce
tableau** et continuer avec la vraie valeur.

## 1. Où tourne quoi (staging, au 2026-10-09)

| Brique | Hébergement |
|---|---|
| Frontend (`herverenard147/nouankanyai-frontend`, branche `main`) | projet Vercel `nouankany-staging-frontend`, redéployé à chaque push. L'URL du backend vient de `.env.production` (`VITE_API_BASE_URL`), pas d'une variable Vercel : la changer veut dire modifier ce fichier et pousser |
| Backend (`herverenard147/NouanKanyAI`, branche `main`) | service web Render `nouankany-staging-backend` (URL avec suffixe aléatoire, voir le tableau de bord Render), redéployé à chaque push. `AI_MODE=mock` : l'assistant répond en simulation tant qu'il n'est pas passé à `live` |
| Base de données | **Neon**, la même depuis le début : toujours la réutiliser, jamais en créer une neuve sans demande explicite |
| À débrancher (non vérifié depuis le 2026-10-01) | le projet Vercel `nouankanyai-frontend` (répertoire racine `frontend`), relié **par erreur au dépôt backend** : il est rouge sur chaque PR backend |
| Lambda `ml-service` | branchée depuis le 2026-10-09 (variables `ML_SERVICE_*` sur Render, image ECR `resync-2026-10-09`) : prévisions et recommandations calculées sur la Lambda, repli local automatique si elle ne répond pas |
| Réveil | plan gratuit Render : le service s'endort après 15 min sans requête (réveil ~100 s). La tâche GitHub Actions « Keep-alive staging » du dépôt backend l'appelle toutes les 10 min ; à retirer si le plan devient payant |

Historique de l'hébergement du backend : Render, puis Railway, puis Fly.io, puis Render sur un nouveau compte (chaque fois une
fin d'essai ou de crédit, pas un choix technique). Les mentions de Railway et de Fly.io ailleurs sont périmées.

`vercel.json` réécrit toutes les routes vers `/index.html`. Aucun secret dans le dépôt.

## 2. Ordre de mise en ligne (⚠ = demander confirmation au propriétaire avant)

1. **Lambda** (configurée sur ce staging) : redéployer `ml-service` d'abord quand `ml/` change, voir son `CLAUDE.md`. ⚠ Le déploiement de la Lambda demande l'accord explicite du propriétaire.
2. **Migrations** sur Neon, depuis `NouanKanyAI/backend` : `alembic current` ; s'il est vide,
   `alembic stamp 0002_add_photo_and_auto_resolve` ; puis `alembic upgrade head` (révisions 0003 à 0005 : facturation,
   démarrage à froid, référentiel d'équipements). Plus jamais `alembic stamp head` sur une base existante.
3. **Backend** : ⚠ fusion dans `main`, Render redéploie. Contrôles : `GET /` répond ; `GET /api/v1/billing` répond 200 avec un
   jeton, 401 sans. **CORS** : le domaine Vercel du frontend doit figurer dans `FRONTEND_URL` ou `ALLOWED_ORIGINS` (règle 6 du
   `CLAUDE.md` backend) ; les aperçus de PR (`*.vercel.app`) n'y sont pas.
4. **Frontend** : ⚠ fusion dans `main`, Vercel redéploie. Le frontend appelle `/api/v1/billing`, `/api/v1/ml/cold-start` et
   `/api/v1/contact` : le backend doit être déployé avant, sinon les pages Facturation, Modèles et Messages sont en erreur.
5. Contrôler l'URL publique (§5).

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
- Le script **refuse un hôte non local** sans `--allow-remote`. **Le lancer sur le staging seulement si le propriétaire
  le demande explicitement** (comptes à mot de passe public sur un site en ligne) ; **jamais sur une vraie production**.
- Ces données sont des **données de test** (relevés simulés par le backend) : elles ne doivent pas être présentées comme réelles.
- L'Audit n'est pas rétro-rempli : il ne contient que les actions faites après le déploiement.

## 4. Reste à faire côté frontend

- Parcours réels de bout en bout avec les 4 comptes, aux 3 niveaux, à 390, 768, 1024 et 1440 px, sur le site déployé.
- Pages restées à l'ancien style (cartes) : Alertes, Conseils, Recommandations, Journal, Admin (Santé, Utilisateurs, Demandes
  d'audit) : les passer au langage visuel de `DESIGN.md` §2 (filets, coins droits).
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

Facturation (2026-10-08) : PME et Industrie paient un audit de référence, une redevance mensuelle et 40 % (30 à 50) des
économies mesurées sur leurs factures CIE ; les ménages paient un abonnement par palier (Découverte gratuit, Essentiel
2 900 FCFA, Optimum 7 900 FCFA) ; calcul et relevés seulement, pas de paiement en ligne. Les gains estimés des actions
automatiques restent indicatifs. La landing garde « Structure définie lors de l'audit » ; libellé « Gratuit pour commencer »
retiré ; « capteur » permis quand il désigne un élément précis ; aucune mention du modèle côté client, uniquement dans le volet
Admin (page « Modèles & observabilité » et nom du modèle sur la Prédiction de l'Admin) ; le Journal est conservé (ce n'est
pas un audit).
