# Nouankany — DESIGN.md (dashboard et landing)

Document d'orientation pour qui continue le design dans ce dépôt (Claude Code en local compris).
Il dit **ce qui est fait**, **ce qui reste à faire** et **les règles à suivre** pour chaque écran et
chaque type de compte. Il complète `CLAUDE.md` (pièges techniques) et `README.md` (structure, API).

Les maquettes validées sont dans le canvas « Nouankany — Propositions de design » :
`E` (landing complète), `F2` (section « problème »), `G1` (vue d'ensemble Industrie, bureau 1440×900,
niveau technique) et `G2` (même vue, mobile). `G1`/`G2` ont été validées par le propriétaire.

## 1. Règles non négociables

1. **Aucun élément factice.** Pas de chiffre, témoignage, logo ou graphique inventé. Pas de donnée → état
   vide (`MetricState`, « Aucune donnée pour le moment. »).
2. **Toute donnée affichée porte sa provenance** (`ProvenanceBadge` : mesuré / estimé / synthétique /
   télémétrie système). Jamais codée en dur : elle vient de l'objet de donnée.
3. **Une vue d'ensemble tient sur un écran** (1440×900 au niveau technique). Elle montre l'essentiel et
   renvoie vers les pages de détail par des raccourcis ; elle n'explique pas. Tout texte long vit dans la
   page de détail.
4. **La barre latérale est statique** : `sticky top-0 h-screen` (bureau), tiroir plein hauteur (mobile). La
   déconnexion et le rappel capteurs restent visibles sans défiler.
5. **Le niveau d'affichage change réellement l'écran** (débutant / amateur / technique), voir §4. Aucune page
   n'écrit `if (level …)` en dur : la règle est dans un fichier testé.
6. **Pas de motifs « IA »** : pas de petits libellés en capitales au-dessus de chaque titre, pas de cartes
   numérotées, pas de dégradés, pas de pastille « badge » décorative, pas d'icônes-lettres.
7. **Un sous-titre par type de compte**, en haut de chaque vue d'ensemble, sous `DemoDataBanner` (absent
   pour l'Admin) — textes décidés, déjà en place :
   - Ménage : « Vue d'ensemble de votre foyer : consommation, prédiction et dernière facture CIE en un coup d'œil. »
   - PME : « Vue d'ensemble de votre activité : consommation, prédiction et équipements déclarés sur vos sites. »
   - Industrie : « Vue d'ensemble de votre site industriel : consommation, prédiction, machines suivies et plan d'action en cours. »
   - Admin : « Vue d'ensemble de la plateforme : alertes tous profils confondus et accès rapide aux outils d'administration. »
8. **Nombres à la française** (virgule, espace avant l'unité : « 75,0 °C ») : `formatNumberFr`, ou
   `frenchNumbersWithUnits` pour les textes venus du backend.

## 2. Langage visuel (déjà dans `src/styles/index.css`, `@theme`)

| Rôle | Valeur / token |
|---|---|
| Encre, fond sombre (barre latérale, hero, formules) | `--color-dark-bg` `#1c1f1b`, texte `dark-text` `#c7c7c0`, champs `dark-field` `#262922` |
| Accent (boutons d'action, badges de compte, barres) | `--color-accent` `#e8590c` ; texte dessus : `text-primary` (jamais blanc) |
| Liens et texte d'action sur fond clair | `--color-accent-cta` `#7a2c05` |
| Fond de page / panneau neutre | `bg` `#fafaf9` / `bg-elevated` `#f1f1ee` ; bordures `border` `#e2e1db` |
| Alerte | `alert` `#d6293e` ; confirmation `confirm` `#1b7a43` |
| Titres | Hanken Grotesk 700, `tracking-[-0.02em]`, interligne ~1,05 |
| Texte | Inter ; valeurs, axes et étiquettes techniques : IBM Plex Mono |

- **Filets, pas de cartes** : sections séparées par `border-t` (trait épais `border-t-2 border-text-primary`
  en tête d'un bloc), pas de `Card` ni d'ombres sur la vue d'ensemble. Coins droits.
- **Cibles tactiles ≥ 44 px** (`min-h-11`), focus visible (`focus-ring`).
- **Icônes** : `lucide-react`, trait 1,8 ; table chemin → icône dans `src/lib/navIcons.ts`.

## 3. Briques de la vue d'ensemble (`src/components/overview/`)

| Composant | Rôle |
|---|---|
| `KpiStrip` | 4 indicateurs en bande (2×2 sur mobile), chacun un lien vers la page où l'on agit. Même source que `KpiGrid` (`useKpi`). |
| `AlertsSummary` | Compte, 2 alertes les plus graves, « Toutes les alertes », « Voir les conseils (n) », « + N autres ». |
| `PredictionSummary` | Valeur, coût estimé, `BarChart size="compact"` (24 barres, une étiquette sur 6), lien « Voir la prédiction ». |
| `MachinesSummary` | 5 machines max, anomalies d'abord ; colonnes selon le niveau ; provenance par ligne. |
| `ShortcutList` + `TariffMini` | Raccourcis vers les pages de détail, avec un état court à droite. |

`BarChart` a une taille `compact` et une prop `xLabelEvery` (étiquettes d'abscisse espacées).

## 4. Matrice profil × niveau

Niveau par défaut (`levelStore.ts`) : **Ménage = débutant (fixe, aucun sélecteur)**, **PME = amateur**,
**Industrie = technique**, **Admin = technique**. Le choix est local (`localStorage`, clé `nouankany-level`) et
conservé après rechargement. Sélecteur : `TopBar` (bureau), `Paramètres` (mobile).

### Industrie — IMPLÉMENTÉ (`src/lib/overviewLevels.ts`, testé)

| Bloc | Débutant | Amateur | Technique |
|---|---|---|---|
| Sous-titre, indicateurs clés, alertes, prédiction (valeur + graphique) | oui | oui | oui |
| Ligne « modèle · jeu de données » sous la prédiction | non | non | **oui** |
| Machines : colonnes | Machine, Statut, Priorité | idem | **+ Température, Vibration, Pression** |
| Raccourcis | Conseils, Paliers tarifaires | idem | **Plan d'action, Historique des résolutions**, Paliers |

### PME, Ménage, Admin — À FAIRE (proposition, à valider avec le propriétaire)

Appliquer le même gabarit (en-tête, `KpiStrip`, bloc prédiction + alertes, bloc résumé + raccourcis) avec
une fonction `…OverviewBlocks(level)` par profil dans `src/lib/overviewLevels.ts`, et son test.

| Profil | Niveaux | Contenu proposé de la vue d'ensemble |
|---|---|---|
| **PME** (amateur par défaut) | 3 | `KpiStrip` (cibles : puissance/machines → `/app/equipements`, économies → `/app/rapports`, anomalies → `/app/alertes`) ; prédiction + alertes ; résumé des équipements déclarés (`Catégorie, Site, Statut` ; dès amateur `+ Marque, Modèle, Priorité`, comme aujourd'hui) ; raccourcis Conseils, Recommandations, Factures CIE, Commission. |
| **Ménage** (débutant, sans sélecteur) | 1 | Gabarit le plus court : prédiction + alertes ; « Dernière facture CIE » (période, consommation, montant seulement) ; raccourcis Conseils, Factures, Recommandations. À décider : le KPI « Part sur les économies » (commission) n'a pas de sens pour une formule gratuite — voir §6. |
| **Admin** (technique par défaut) | 3 | `KpiStrip` télémétrie (base de données, uptime, latence 5 min, machines plateforme — provenance « télémétrie système ») ; alertes tous profils ; les 4 outils d'administration en raccourcis ; pas de `DemoDataBanner`. |

## 5. État écran par écran

Légende : ✅ fait · ◐ cadre fait (barre latérale, en-tête) mais contenu à refaire · ☐ à faire.

| Écran (route) | Industrie | PME | Ménage | Admin | Gating par niveau déjà en place (à conserver) |
|---|---|---|---|---|---|
| Vue d'ensemble `/app/apercu` | ✅ | ☐ | ☐ | ☐ | voir §4 |
| Alertes `/app/alertes` | ◐ | ◐ | ◐ | ◐ | registre « actions automatiques » dès amateur |
| Machines `/app/machines` | ◐ | — | — | — | colonnes capteurs au niveau technique |
| Équipements `/app/equipements` | — | ◐ | — | — | colonnes complètes dès amateur |
| Conso & coûts `/app/consommation` | ◐ | ◐ | ◐ | ◐ | — |
| Prédiction `/app/prediction` | ◐ | ◐ | ◐ | ◐ | détail du modèle au niveau technique |
| Conseils `/app/conseils` | ◐ | ◐ | ◐ | — | impact chiffré dès amateur |
| Recommandations `/app/recommandations` | ◐ | ◐ | ◐ | — | impact chiffré dès amateur |
| Factures CIE `/app/factures` | ◐ | ◐ | ◐ | — | — |
| Commission `/app/rapports` | ◐ | ◐ | — | — | — |
| Journal `/app/journal` | ◐ | — | — | ◐ | — |
| Paramètres `/app/parametres` | ◐ | ◐ | ◐ | ◐ | sélecteur de niveau (hors Ménage) |
| Admin : santé, modèles, utilisateurs, demandes d'audit | — | — | — | ◐ | — |

Pour chaque écran « à faire » : en-tête (titre + sous-titre court), filets au lieu de cartes, provenance sur
chaque donnée, états vides, mobile 390 px sans défilement horizontal, textes d'explication déplacés ou
supprimés. **Ne pas changer** les règles de niveau ci-dessus sans les mettre à jour dans ce fichier.

Reste de la refonte du cadre : `NAV_BY_PROFILE` contient encore l'ancien champ `icon` (lettres) devenu
inutile — à supprimer avec `NavEntry.icon` ; `ActionPlanList`, `ResolutionsList`, `KpiGrid`, `PredictionPanel`
ne sont plus utilisés par la vue d'ensemble Industrie (à réutiliser pour des pages dédiées ou à supprimer).

## 6. Décisions en attente (ne pas trancher sans le propriétaire)

1. **Part de 10 % sur les économies** : appliquée par le backend (`gross_savings * 0.10`) et affichée dans le
   dashboard, mais la landing dit « Structure définie lors de l'audit ». Annoncer le 10 % sur la landing, ou en faire
   un paramètre par contrat ?
2. **Plan d'action mensuel chiffré et historique des résolutions** n'ont pas de page dédiée et le backend ne les
   produit pas (listes vides). Les raccourcis pointent provisoirement vers `/app/recommandations` et `/app/journal`.
3. **KPI « Part sur les économies » pour le Ménage** (formule gratuite, pas de commission).
4. **Libellé « Gratuit pour commencer »** de la formule Découverte (Ménages) alors que le segment n'est pas ouvert.
5. **Textes générés par le backend** (« Éteignez Compresseur d'air » : article manquant) : correction côté backend.

## 7. Tester en local, avec le vrai backend

```bash
# 1) Backend (dépôt herverenard147/nouankanyai ; PostgreSQL requis)
DATABASE_URL=postgresql://… JWT_SECRET=… SUPERADMIN_EMAIL=admin@nouankany.demo \
FRONTEND_URL=http://localhost:5173 AI_MODE=mock PORT=8001 python backend/main.py
# 2) Comptes et données de démonstration (script de la PR NouanKanyAI#1, idempotent)
python backend/scripts/seed_demo.py --with-alert
# 3) Frontend
npm run dev            # http://localhost:5173, VITE_API_BASE_URL=http://localhost:8001
npm run test           # inclut le test d'intégration (13 tests) contre ce backend
```

Comptes (mot de passe `demo1234`) : `aicha@menage.demo` (Ménage), `contact@boulangerie-awale.demo` (PME),
`exploitation@yopougon-l2.demo` (Industrie), `admin@nouankany.demo` (Admin). Vérification visuelle : voir
`CLAUDE.md` (Chrome) ; Playwright fonctionne aussi et permet un vrai redimensionnement (390 px, 1440 px).

Contrôles à refaire pour chaque écran refait : `npx tsc -b`, `npx oxlint src`, `npm run test`, les trois niveaux
(`Débutant`, `Amateur`, `Technique`) sur les profils qui ont un sélecteur, 1440×900 et 390×844 (aucun
défilement horizontal), barre latérale immobile au défilement, aucune erreur console/HTTP.
