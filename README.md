# Nouankany : front-end

Front-end fonctionnel de Nouankany : landing publique, connexion et dashboard
multi-pages (Ménage, PME, Industrie, Portail Admin), **branché sur le backend réel**
[`herverenard147/NouanKanyAI`](https://github.com/herverenard147/NouanKanyAI)
(branche `main`). Seul `main` est mis en ligne (Vercel).

Construit au départ à partir d'un handoff de design d'août 2026 (retiré du dépôt le 2026-10-23, il reste dans l'historique git) ; les règles de design qui font foi sont dans `DESIGN.md`. Puis intégré au backend réel en conservant l'architecture, les composants et les
types déjà en place : voir « Couche d'adaptation » plus bas pour le détail du
mapping entre le contrat du backend et ces types.

## Suivi du projet

L'état vérifié du projet (ce qui est en ligne, ce qui est fait, pièges, points ouverts) est tenu dans le
dépôt backend : `docs/SUIVI_TECHNIQUE.md`, avec le journal PR par PR `docs/JOURNAL_AVANCEMENT.md`.
Ici : `DESIGN.md` (règles et état des écrans) et `MISE_EN_LIGNE.md` (déploiement). Nombre de tests de
référence : voir ce suivi.

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
`http://localhost:5173` pour le dev local : voir garde-fous CLAUDE.md du
backend, seule variable ajoutée à ce fichier).

Frontend :

```bash
npm install
npm run dev        # http://localhost:5173, VITE_API_BASE_URL=http://localhost:8001 (voir .env.development)
```

Autres commandes :

```bash
npm run build       # tsc -b && vite build : build de production
npm run preview      # sert le build de production en local
npm run test         # vitest, suite de tests légers + smoke test d'intégration backend
npm run lint          # oxlint
```

## Comptes de démonstration

Comptes réels du backend local, créés par `python backend/scripts/seed_demo.py --with-alert --with-history`
(idempotent). L'encart de `/login` les affiche en développement seulement, sans le compte admin. Sur le
site en ligne, ces comptes ont des mots de passe propres (gardés hors dépôt) : `demo1234` n'y marche pas.

| Profil     | Email                                  | Mot de passe | `type_compte` backend |
|------------|-----------------------------------------|--------------|------------------------|
| Ménage     | `aicha@menage.demo`                     | `demo1234`   | `Ménage` |
| PME        | `contact@boulangerie-awale.demo`        | `demo1234`   | `PME` |
| Industrie  | `exploitation@yopougon-l2.demo`         | `demo1234`   | `Industrie` |
| Admin      | `admin@nouankany.demo`                | `demo1234`   | `platform_role: superadmin`, donné par `backend/scripts/promote_admin.py` |

Comptes de test avec un an de données (Ménage, PME, Industrie) : `python backend/scripts/seed_year.py`
(voir son aide). Un nouveau compte peut aussi être créé depuis `/login` (bascule « Créer un compte »).

Le backend n'a pas de champ "profil" natif : `src/lib/profileMapping.ts` dérive
`menage | pme | industrie | admin` à partir de `type_compte` (texte libre saisi
à l'inscription, valeurs reconnues : Ménage/PME/Industrie) et `platform_role`
(`admin`/`superadmin` → toujours `admin`, prioritaire ; `technicien` → profil technicien : Interventions, Documentation, Paramètres). La session
(`sessionStore`, persistée en `localStorage`) porte le JWT réel du backend.

## Structure des dossiers

```
src/
├── routes/         Router (React Router), gardes de route
├── layouts/        PublicLayout (landing/login), AppLayout (shell dashboard)
├── pages/
│   ├── landing/     Landing publique (statique, indépendante du backend)
│   ├── auth/        Connexion + inscription
│   ├── legal/        Pages CGU et confidentialité (règles par type de compte)
│   └── app/          Les pages du dashboard (app/overview/ = 4 vues par
│                       profil, app/admin/ = pages réservées à l'Admin : utilisateurs, facturation, modèles, données d'entraînement, prix du matériel, boîtiers, messages, demandes d'audit, santé ;
│                       sources de mesures, interventions, documentation)
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
  `type === 'alerte'` uniquement, un vrai problème détecté
  (anomalie/surchauffe/vibration), en stricte correspondance : les deux pages
  montrent exactement les mêmes éléments, la première avec un bouton
  « Marquer comme résolu » (re-mesure simulée tant qu'aucun capteur n'est branché, `POST
  /api/machines/{id}/test`), la seconde avec les étapes de dépannage
  détaillées et un bouton « Lancer le diagnostic » (même endpoint). Le
  champ `auto_resolu` vaut toujours `false` : aucun délestage n'est exécuté par
  `/api/recommend` (Volet 2, C3). `optimisation`/`efficacite` (des suggestions, pas des
  problèmes : pas de sens à les « résoudre ») sont filtrées à part par
  `recommendations.ts` vers la page dédiée `/app/recommandations`, sans
  bouton de résolution.
- **Registre des alertes** (`/app/alertes`, depuis le 2026-10-16) : la page lit
  `GET /api/v1/alerts` (`useAlertRegistry`) : alertes ouvertes, dépassements prévus,
  historique jamais effacé, et le volet « qu'avez-vous fait ? » (`AlertFeedbackForm`,
  `POST /api/v1/alerts/{id}/feedback`) selon le niveau d'affichage. `AlertNotifier` relit les
  alertes ouvertes chaque minute et annonce celles apparues pendant la visite. Le technicien
  en intervention a son onglet Alertes (`InterventionAlertsPage`).
- **KPI** : dérivés de `/api/machines` + `/api/v1/billing` (client), ou de
  `/api/admin/metrics.system` (admin).
- **Prédiction** : `/api/predict` (rythme réel de l'appareil, modèles relatifs en renfort, XGBoost en repli) est par machine, `prediction.ts`
  interroge chaque équipement du compte séparément puis agrège en une
  prédiction globale (somme point par point). `/app/prediction` affiche les
  deux, avec un sélecteur Heure (24 barres, kW) / Jour (7 barres, kWh) /
  Semaine (4 barres, kWh) : même horizon backend, juste agrégé différemment
  côté frontend (`predict_next_hours()` fait déjà varier heure-du-jour et
  jour-de-semaine sur tout l'horizon demandé). L'aperçu compact des pages Vue
  d'ensemble (`PredictionPanel`) n'affiche que la prédiction globale, à
  l'heure.
- **Historique des résolutions** : `fetchResolutions` lit `GET /api/v1/plan/resolutions`
  (écrit par « Vérifier » sur une machine) ; seules les mesures que l'appareil a sont affichées.
- **Seuils** (`/app/parametres` et fiche d'un appareil) : seuils du compte
  (`temperature_max_c`, `vibration_max_mm_s`, `surconsommation_ratio`), et réglage propre à
  un appareil ; à défaut, le backend applique ceux de la famille de l'appareil.
- **Facturation** (`/app/facturation`, `/api/v1/billing`) : ce que le client
  paie à Nouankany (contrat PME/Industrie ou palier ménage) est distinct de ses
  factures d'électricité (`/api/bills`, page `/app/factures`). `/app/rapports`
  génère les rapports énergétiques (`/api/v1/reports/generate`).
- **Plan d'action** : `fetchActionPlan` lit `/api/v1/plan/items` et reprend les
  recommandations chiffrées du moteur (`/items/import`, idempotent).
- **Actions admin réelles** : `/app/admin/utilisateurs` a un drill-down par
  utilisateur (ses machines + sa facturation du mois, `GET
  /api/admin/users/{id}/machines|facturation`) et un bouton promouvoir/rétrograder
  (`PATCH .../role`, visible seulement si le compte connecté est superadmin : le
  backend renvoie 403 sinon) ; `/app/admin/modeles` a un bouton « Recharger les
  modèles » (`POST /api/v1/ml/reload`) ; `/app/factures` a une action « la vraie
  facture est arrivée » pour confirmer le montant réel d'une prévision (`PATCH
  /api/bills/{id}/actual`).
- **Modèles et observabilité** (`/app/admin/modeles`, Admin seulement) : métriques des modèles,
  dérive (PSI, Kolmogorov-Smirnov), démarrage à froid, collecte de mesures réelles, appels Gemini,
  rechargement des modèles. Le F1 du modèle v2 de détection est annoté « recherche » : il n'est pas
  déployé.
- **Profil** (`/app/parametres`) : `useAuthMe`/`GET /api/auth/me` affiche
  email, type de compte, membre depuis, dernière connexion ; le nom est
  modifiable (`PATCH /api/auth/me`, restreint au nom : `type_compte`
  n'est volontairement pas éditable en self-service, il détermine tout le
  profil produit) et le mot de passe se change via `POST
  /api/auth/change-password`.

Chaque bloc d'UI (une carte KPI, un panneau admin, un registre d'alerte…) reste
alimenté par sa **propre requête** (`src/hooks/queries/`), jamais un appel
global : une carte peut passer en état « indisponible » (backend indisponible,
requête en erreur) sans casser le reste de la page (voir
`src/components/state/MetricState.tsx`). Ce n'est plus une simulation : c'est
le comportement réel face à une vraie panne réseau ou backend.

## Lecture des factures par photo

`/app/factures` a un vrai bouton d'upload photo (`POST
/api/bills/upload-photo`), branché sur la lecture de facture côté backend
(`backend/app/ai/nouankany_vision.py` : vision Gemini, pas le pipeline
ReceiptFlow/Donut, écarté car fine-tuné sur un domaine sans rapport, voir le
README backend). Un seul et même bouton couvre deux types de documents,
détectés automatiquement par le modèle : une facture CIE papier
(mois/montant/kWh) ou un reçu de paiement numérique (Wave, Orange Money, MTN
Money, Moov Money, application CIE : montant/opérateur/référence). Les
champs optionnels correspondants (`document_type`, `payment_operator`,
`payment_reference`) s'affichent via `OcrFieldList` sur la fiche facture. La
prévision statistique (`POST /api/bills/forecast`) et la saisie manuelle
(`POST /api/bills/manual`) restent disponibles en complément.

## Provenance des données

Chaque valeur affichée porte un badge de provenance : `mesuré` pour une mesure reçue d'une
source réelle (boîtier, passerelle, logiciel, capteur, fichier), `estimé` pour une valeur déclarée
ou tirée du référentiel, `synthétique` pour une sortie de modèle ou un relevé simulé, `télémétrie
système` pour les métriques d'infrastructure de l'Admin. Aucun capteur physique n'est encore
branché : sur le site en ligne, les relevés restent simulés. Le champ `provenance` est porté par chaque item de donnée dans
`src/types/domain.ts`, jamais codé en dur dans un composant.

## Sécurité

Le jeton de session vit dans le stockage du navigateur (`sessionStore`) : un passage en cookie
protégé est reporté (il demande que l'API passe par le même domaine que le site). Les en-têtes de
sécurité du site sont dans `vercel.json`.

## Vérification

- À chaque PR, la CI lance `tsc -b`, `vitest run`, `oxlint` et `vite build` ; le nombre minimal
  de tests est dans `.github/test-baseline.json`. Nombre de tests : voir le suivi (CI GitHub
  suspendue jusqu'au 1er novembre 2026 : mêmes commandes lancées en local avant chaque fusion).
- `src/test/backendIntegration.smoke.test.ts` exerce le vrai backend local (comptes de
  `seed_demo.py`) : lectures et mutations câblées à l'interface. Il est sauté sans backend local
  et ne tourne pas en CI.
- Vérification visuelle : Claude in Chrome ou Playwright, à 390, 768, 1024 et 1440 px (voir
  `CLAUDE.md`, pièges de redimensionnement).
