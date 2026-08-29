# Nouankany — front-end

Front-end fonctionnel de Nouankany : landing publique, connexion et dashboard
multi-pages (Ménage, PME, Industrie, Portail Admin), **branché sur le backend réel**
[`herverenard147/NouanKanyAI`](https://github.com/herverenard147/NouanKanyAI)
(branche `feature/merge-steph-ml-subsystem`).

Construit à partir du handoff de design dans `design_handoff_nouankanyai/` (source
de vérité visuelle, non modifiée) en suivant `design_handoff_nouankanyai/PROMPT_CLAUDE_CODE.md`,
puis intégré au backend réel en conservant l'architecture, les composants et les
types déjà en place — voir « Couche d'adaptation » plus bas pour le détail du
mapping entre le contrat du backend et ces types.

## Lancement

Backend requis (voir son propre README pour l'installation complète : Python
3.10+, PostgreSQL, `pip install -r backend/requirements-dev.txt`). En local,
sur un port distinct de celui du frontend :

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/nouankany \
JWT_SECRET=un-secret-long-aleatoire \
FRONTEND_URL=http://localhost:5173 \
AI_MODE=mock \
PORT=8001 \
python backend/main.py
```

`FRONTEND_URL` est aussi lisible depuis `backend/.env` (déjà renseigné avec
`http://localhost:5173` pour le dev local — voir garde-fous CLAUDE.md du
backend, seule variable ajoutée à ce fichier).

Frontend :

```bash
npm install
npm run dev        # http://localhost:5173, VITE_API_BASE_URL=http://localhost:8001 (voir .env.development)
```

Autres commandes :

```bash
npm run build       # tsc -b && vite build — build de production
npm run preview      # sert le build de production en local
npm run test         # vitest, suite de tests légers + smoke test d'intégration backend
npm run lint          # oxlint
```

## Comptes de démonstration

Comptes réels, créés via `POST /api/auth/signup` sur le backend (pas une liste
statique locale) — affichés aussi dans l'encart de `/login`.

| Profil     | Email                                  | Mot de passe | `type_compte` backend |
|------------|-----------------------------------------|--------------|------------------------|
| Ménage     | `aicha@menage.demo`                     | `demo1234`   | `Ménage` |
| PME        | `contact@boulangerie-awale.demo`        | `demo1234`   | `PME` |
| Industrie  | `exploitation@yopougon-l2.demo`         | `demo1234`   | `Industrie` |
| Admin      | `admin@nouankany.demo`                | `demo1234`   | `platform_role: superadmin` |

Ces comptes n'existent que si vous les avez créés vous-même (signup) sur votre
instance de backend — ils ne sont pas seedés automatiquement. Un nouveau compte
peut être créé directement depuis `/login` (bascule « Créer un compte »).

Le backend n'a pas de champ "profil" natif : `src/lib/profileMapping.ts` dérive
`menage | pme | industrie | admin` à partir de `type_compte` (texte libre saisi
à l'inscription, valeurs reconnues : Ménage/PME/Industrie) et `platform_role`
(`admin`/`superadmin` → toujours `admin`, prioritaire). La session
(`sessionStore`, persistée en `localStorage`) porte le JWT réel du backend.

## Structure des dossiers

```
src/
├── routes/         Router (React Router), gardes de route
├── layouts/        PublicLayout (landing/login), AppLayout (shell dashboard)
├── pages/
│   ├── landing/     Landing publique (statique, indépendante du backend)
│   ├── auth/        Connexion + inscription
│   ├── legal/        Stubs CGU / confidentialité
│   └── app/          Les pages du dashboard (app/overview/ = 4 vues par
│                       profil, app/admin/ = 3 pages réservées à l'Admin)
├── components/       Composants transverses, inchangés par l'intégration
│   (provenance, alerts, level, kpi, tariff, charts, prediction, advice, plan,
│   anomalies, table, upload, assistant, state, layout, ui)
├── api/               Couche d'adaptation backend → types vue (détail ci-dessous)
├── hooks/queries/     Un hook TanStack Query par bloc d'UI (au-dessus de api/)
├── store/             Zustand : session (JWT réel), niveau d'affichage, état d'UI
├── types/
│   ├── domain.ts        Types "vue" consommés par les composants (inchangés)
│   └── backend.ts        Formes brutes exactes du wire format backend
├── lib/               navConfig, profileMapping (type_compte → profil),
│                        formatters (fr-FR/FCFA), a11y
└── test/              Tests légers + smoke test d'intégration backend réel
```

## Couche d'adaptation (`src/api/`)

Les composants et hooks consomment les types "vue" de `src/types/domain.ts`
(`Alert`, `Kpi`, `Prediction`, `Advice`, `EquipmentRow`/`MachineRow`…), hérités
du handoff de design initial. Le backend réel a un modèle de données différent
(comptes génériques, sites/machines, facturation Gain-Share, pas de notion
d'« alerte à deux registres » ni de « badge de provenance » natifs) : chaque
module de `src/api/` **adapte** la réponse réelle vers ces types, plutôt que de
les remplacer. `src/api/rawBackend.ts` centralise tous les appels HTTP bruts,
typés avec `src/types/backend.ts` (le wire format exact, vérifié endpoint par
endpoint contre `/docs`) ; les autres modules (`alerts.ts`, `kpis.ts`,
`prediction.ts`, `advice.ts`, `equipment.ts`, `machinesTable.ts`,
`anomalies.ts`, `consumption.ts`, `journal.ts`, `adminModels.ts`,
`adminUsers.ts`…) font le mapping.

Mappings notables (le detail exact est commenté dans chaque fichier) :

- **Alertes / Conseils / Recommandations** : les trois pages lisent
  `POST /api/recommend`, qui renvoie des recommandations typées
  (`alerte`/`optimisation`/`efficacite`/`délestage`). `/app/alertes` et
  `/app/conseils` (`alerts.ts`/`advice.ts`) filtrent toutes deux sur
  `type === 'alerte'` uniquement — un vrai problème détecté
  (anomalie/surchauffe/vibration), en stricte correspondance : les deux pages
  montrent exactement les mêmes éléments, la première avec un bouton
  « Marquer comme résolu » (re-mesure réelle, `POST
  /api/machines/{id}/test`), la seconde avec les étapes de dépannage
  détaillées et un bouton « Lancer le diagnostic » (même endpoint). Le
  délestage auto-exécuté (`auto_resolu`) vit exclusivement dans le Journal
  (`AutoAlertCard`). `optimisation`/`efficacite` (des suggestions, pas des
  problèmes — pas de sens à les « résoudre ») sont filtrées à part par
  `recommendations.ts` vers la page dédiée `/app/recommandations`, sans
  bouton de résolution.
- **KPI** : dérivés de `/api/machines` + `/api/facturation` (client), ou de
  `/api/admin/metrics.system` (admin).
- **Prédiction** : `/api/predict` (XGBoost) est par machine — `prediction.ts`
  interroge chaque équipement du compte séparément puis agrège en une
  prédiction globale (somme point par point). `/app/prediction` affiche les
  deux, avec un sélecteur Heure (24 barres, kW) / Jour (7 barres, kWh) /
  Semaine (4 barres, kWh) — même horizon backend, juste agrégé différemment
  côté frontend (`predict_next_hours()` fait déjà varier heure-du-jour et
  jour-de-semaine sur tout l'horizon demandé). L'aperçu compact des pages Vue
  d'ensemble (`PredictionPanel`) n'affiche que la prédiction globale, à
  l'heure.
- **Anomalies** : la page dédiée `/app/anomalies` (Industrie) a été retirée —
  elle lisait `machine.status` (un champ persisté, mis à jour seulement par
  `/simulate`/`/reset`/`/test`), une source différente et pas forcément
  synchronisée avec le score Isolation Forest recalculé par `/api/recommend`
  à chaque affichage sur Alertes/Conseils, ce qui pouvait les contredire.
  `ResolutionsList` (« Historique des résolutions d'anomalies », affichée sur
  Vue d'ensemble Industrie) reste en place — elle dépend de `fetchResolutions`
  (backend n'a aucun mécanisme pour marquer une résolution, renvoie toujours
  `[]`), inchangée par ce retrait.
- **Seuils** (`/app/parametres`) : le backend n'a qu'un seul jeu de seuils par
  compte (`temperature_max_c`, `vibration_max_hz`, `surconsommation_ratio`),
  affiché et édité dans sa forme réelle plutôt que forcé dans l'ancienne union
  `Thresholds` (global/per-equipment/multi-level), qui ne correspond à aucune
  de ces trois formes ici.
- **Facturation** (`/app/rapports`) : le backend distingue la facturation
  Gain-Share (commission Nouankany, `/api/facturation`) des factures
  d'électricité du client (`/api/bills`, page `/app/factures`) — deux concepts
  différents, deux pages différentes.
- **Sans donnée honnête disponible** : `fetchActionPlan` et `fetchResolutions`
  renvoient `[]` (pas de "plan d'action mensuel" ni de résolution
  d'anomalie marquée côté backend aujourd'hui) plutôt qu'une valeur inventée —
  `MetricState` affiche l'état vide, pas une erreur.
- **Actions admin réelles** : `/app/admin/utilisateurs` a un drill-down par
  utilisateur (ses machines + sa facturation du mois, `GET
  /api/admin/users/{id}/machines|facturation`) et un bouton promouvoir/rétrograder
  (`PATCH .../role`, visible seulement si le compte connecté est superadmin — le
  backend renvoie 403 sinon) ; `/app/admin/modeles` a un bouton « Recharger les
  modèles » (`POST /api/v1/ml/reload`) ; `/app/factures` a une action « la vraie
  facture est arrivée » pour confirmer le montant réel d'une prévision (`PATCH
  /api/bills/{id}/actual`).
- **Profil** (`/app/parametres`) : `useAuthMe`/`GET /api/auth/me` affiche
  email, type de compte, membre depuis, dernière connexion ; le nom est
  modifiable (`PATCH /api/auth/me`, restreint au nom — `type_compte`
  n'est volontairement pas éditable en self-service, il détermine tout le
  profil produit) et le mot de passe se change via `POST
  /api/auth/change-password`.

Chaque bloc d'UI (une carte KPI, un panneau admin, un registre d'alerte…) reste
alimenté par sa **propre requête** (`src/hooks/queries/`), jamais un appel
global — une carte peut passer en état « indisponible » (backend indisponible,
requête en erreur) sans casser le reste de la page (voir
`src/components/state/MetricState.tsx`). Ce n'est plus une simulation : c'est
le comportement réel face à une vraie panne réseau ou backend.

## OCR factures — extraction NouankanyAI

`/app/factures` a un vrai bouton d'upload photo (`POST
/api/bills/upload-photo`), branché sur l'extraction NouankanyAI côté backend
(`backend/app/ai/nouankany_vision.py` — vision Gemini, pas le pipeline
ReceiptFlow/Donut, écarté car fine-tuné sur un domaine sans rapport, voir le
README backend). Un seul et même bouton couvre deux types de documents,
détectés automatiquement par le modèle : une facture CIE papier
(mois/montant/kWh) ou un reçu de paiement numérique (Wave, Orange Money, MTN
Money, Moov Money, application CIE — montant/opérateur/référence). Les
champs optionnels correspondants (`document_type`, `payment_operator`,
`payment_reference`) s'affichent via `OcrFieldList` sur la fiche facture. La
prévision statistique (`POST /api/bills/forecast`) et la saisie manuelle
(`POST /api/bills/manual`) restent disponibles en complément.

## Provenance des données

Chaque valeur affichée porte un badge de provenance (`estimé` pour les
relevés machine actuels — aucun capteur physique réel n'est encore branché sur
`sensor_metrics`, tout est simulé/déclaré —, `synthétique` pour les sorties de
modèle ML, `télémétrie système` pour les métriques d'infrastructure de
l'Admin ; `mesuré` reste supporté par `ProvenanceBadge` mais n'est utilisé
nulle part). Le champ `provenance` est porté par chaque item de donnée dans
`src/types/domain.ts`, jamais codé en dur dans un composant.

## Sécurité — constat fait pendant l'intégration, non corrigé (hors périmètre)

`backend/.env` est suivi par git avec de vraies clés (Gemini, jeton d'accès
Supabase) déjà commitées avant que `.gitignore` ne les exclue. Je n'ai pas
réécrit l'historique git (hors périmètre, action destructive) : ces clés
doivent être révoquées/régénérées côté backend indépendamment de ce dépôt.

## Vérification effectuée

**Chaque route du backend a été exercée en direct** (curl, avec les comptes de
démo réels) au moins une fois, à l'exception de `POST /api/anomaly` (legacy,
confirmé cassé — bug préexistant `numpy.bool_`, hors périmètre). Ça inclut les
mutations (créer un site/une machine, simuler/réinitialiser une machine,
mettre à jour les seuils, générer une prévision de facture et confirmer un
montant réel, promouvoir/rétrograder un rôle admin, recharger les modèles ML,
upload photo facture et analyse média en mode mock), pas seulement les lectures.

- `npm run build` (TypeScript + Vite) : aucune erreur.
- `npm run test` : suite légère + `src/test/backendIntegration.smoke.test.ts`
  (17 tests), qui se connecte au **vrai backend local** (comptes de démo
  ci-dessus) et exerce, via le code frontend réel (pas des doubles), les
  lectures ET les mutations câblées à l'UI : KPI, alertes, conseils,
  prédiction, consommation, factures (génération de prévision + confirmation
  de montant réel + saisie manuelle), équipements, cycle site → machine →
  simulate → reset, machines, anomalies ouvertes, seuils (lecture + mise à
  jour, restaurée après coup), assistant (`/api/chat`), panneaux admin,
  rechargement des modèles ML, utilisateurs (liste + drill-down machines/
  facturation + promotion/rétrogradation, restaurée après coup), journal.
  Nécessite un backend + PostgreSQL locaux démarrés au préalable — pas
  destiné à tourner en CI.
- `npm run lint`.
- CORS vérifié en conditions réelles (`Origin: http://localhost:5173` contre
  le backend local, en-tête `access-control-allow-origin` confirmé en retour).

**Pas branché à l'UI par choix produit, mais confirmé fonctionnel côté
backend** : `POST /api/bills/upload-photo` et `POST /api/machines/{id}/analyze-media`
(les deux testés en direct en `AI_MODE=mock`, réponses simulées cohérentes) —
l'upload de facture par photo attend ReceiptFlow (voir plus haut) ; l'analyse
média n'a pas d'équivalent dans le handoff de design d'origine, pas ajoutée
sans direction produit.

**Limite connue** : le rendu dans un vrai navigateur n'a pas pu être vérifié
visuellement dans cet environnement (pas de Chrome disponible pour l'outillage
de capture d'écran). La vérification s'est appuyée sur le build, les tests
d'intégration contre le backend réel, le lint et une inspection manuelle du
code — pas sur un test visuel réel. Un passage `npm run dev` + navigation
manuelle est recommandé avant mise en production.
