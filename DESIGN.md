# Nouankany — DESIGN.md (dashboard et landing)

Document d'orientation pour qui continue le design dans ce dépôt (Claude Code en local compris).
Mis à jour le 2026-10-16. Il dit **les règles à suivre**, ce qui est fait et ce qui reste à faire pour chaque écran et
chaque type de compte. Il complète `CLAUDE.md` (pièges techniques) et `README.md` (structure, API).

Les maquettes sont dans le canvas « Nouankany — Propositions de design »
(https://claude.ai/artifact/WnHgKLuo5DF81qHQ7XucGe) :
- **validées** : `E` (landing complète), `F2` (section « problème »), `G1` (vue d'ensemble Industrie, bureau
  1440×900, niveau technique) et `G2` (même vue, mobile) ;
- **validées** (le propriétaire les a approuvées) : 116 planches `H-*` (une page du canvas par type de compte, une ligne par écran, une colonne par
  variante de niveau ; les niveaux qui donnent le même écran partagent une planche) : tous les écrans de
  chaque profil, l'onglet **Audit**, la page **Plan d'action** et les **modales** (§8).
  Les chiffres de ces planches viennent d'une base **locale de test** (reproductible : `seed_demo.py --with-history`) alimentée par `seed_demo.py` et par de vraies
  requêtes sur les endpoints ; ce ne sont pas des données de staging.

## 1. Règles non négociables

1. **Aucun élément factice.** Pas de chiffre, témoignage, logo ou graphique inventé. Pas de donnée → état
   vide (`MetricState`, « Aucune donnée pour le moment. »).
2. **Toute donnée affichée porte sa provenance** (mesuré / estimé / synthétique / télémétrie système). Jamais
   codée en dur : elle vient de l'objet de donnée. **Rendu sobre** (décidé après retour du propriétaire) : texte
   discret gris « Synthétique », « Estimé »… en police normale, **sans pastille colorée ni police mono** ; sur
   une carte d'alerte, une ligne « Source : synthétique » en pied de carte, pas un badge à droite.
   `ProvenanceBadge` doit être restylé en ce sens.
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
   `frenchNumbersWithUnits` pour les textes venus du backend. **Une seule famille pour tous les chiffres**
   (Hanken Grotesk, chiffres tabulaires) : les petits nombres n'ont plus de police mono, qui les différenciait
   des grands et élargissait l'espace entre « 1 500 » et « FCFA ». Dans les maquettes, l'espace est une espace
   fine insécable (U+202F) ; dans le code `formatters.ts` normalise encore en espace normale (voir §9, à faire).
9. **Niveau technique : parler des appareils, pas du modèle.** Aucune mention de « modèle », « XGBoost », « jeu de
   données » ni de « capteur / simulé » dans les écrans client. On explique ce qui se passe sur chaque appareil
   (puissance attendue, température, vibration, pression comparées aux seuils d'alerte). Le détail des modèles
   reste réservé à l'Admin (page « Modèles & observabilité »).
10. **Modifier et supprimer exigent une modale de validation** ; ajouter non (§8).
11. **Graphique à une seule mesure** : quand un graphique horaire n'a qu'un relevé (cas de « Conso & coûts »), on
    montre 24 créneaux, **une barre**, les autres heures vides, à largeur fixe (≈ 480 px), pas une barre
    étirée sur toute la bande.
12. **Graphiques à axes (2026-10-20)** : `TimeChart` (trait d'axe à gauche et en bas, « axe des ordonnées /
    axe des abscisses » sous le graphique, légende, fond « à venir » et trait « maintenant », jours nommés et minuit
    marqué en vue horaire). Conso & coûts n'a plus que cette vue (validée par le propriétaire). Prédiction garde deux
    vues, au choix (`ViewSwitch`, gardé dans le navigateur) : « Mesuré et prévu » et « Prévision par appareil »
    (la vue d'avant). Sans relevé récent, la courbe commence au premier point utile, pas à hier 0 h.
13. **Pic de puissance (2026-10-20)** : Conso & coûts (PME, Industrie), section « Pic de puissance face à la
    puissance souscrite » : pic tenu 10 min, 15 min et 1 h (une durée trop courte pour l'écart entre relevés est dite,
    pas calculée), courbe au quart d'heure avec la puissance souscrite en pointillé rouge, dépassements datés. La
    puissance souscrite se saisit par site dans Paramètres (A, kVA ou kW, cos φ facultatif).
    En basse tension (A ou kVA), chaque pic est aussi donné en ampères : A = kW × 1000 / (220 × cos φ), la formule de
    l'ANARE-CI dans l'autre sens. **Ménage (version simple)** : Ma consommation, carte « Ma plus forte consommation
    aujourd'hui » : le pic le plus court disponible en kW et en ampères (badge « estimé »), l'heure, la part du calibre du
    disjoncteur (barre, message dès 80 %). Pas de tableau ni de trois durées. Le calibre se saisit dans la carte ou se lit
    sur la facture (« Réglage disjoncteur ») ; il est rangé sur un site « Domicile » créé à ce moment-là.
14. **Bouton de niveau page par page (2026-10-20, PME et Industrie)** : seuls les niveaux qui changent vraiment la
    page sont proposés (`src/lib/pageLevels.ts`) ; deux niveaux identiques ne font qu'un bouton, au nom du plus élevé ;
    une page identique à tous les niveaux n'a pas de bouton. Le ménage garde un seul niveau, sans sélecteur ; l'Admin et
    le technicien gardent les trois. Toute nouvelle différence de niveau sur une page doit être reportée dans ce fichier.
15. **Page d'un appareil (2026-10-20)** : `/app/machines/:code` (industrie) et `/app/equipements/:code` (PME, ménage),
    ouverte depuis la fiche de la liste ou le tableau « Ce que coûte chaque appareil ». Période 24 h, 7 jours, 30 jours ;
    consommé, coût, heures de marche, écart à l'attendu (source dite : fiche du modèle ou estimation), part du compte ;
    puissance et chaque mesure relevée face au seuil de l'appareil (une mesure jamais relevée n'a pas de courbe) ; kWh par
    jour face à l'attendu ; habitude semaine et week-end ; prévision 24 h ; alertes de l'appareil. Même vue à tous les
    niveaux : pas de bouton de niveau.

## 2. Langage visuel (déjà dans `src/styles/index.css`, `@theme`)

| Rôle | Valeur / token |
|---|---|
| Encre, fond sombre (barre latérale, hero, formules) | `--color-dark-bg` `#1c1f1b`, texte `dark-text` `#c7c7c0`, champs `dark-field` `#262922` |
| Accent (boutons d'action, badges de compte, barres) | `--color-accent` `#e8590c` ; texte dessus : `text-primary` (jamais blanc) |
| Liens et texte d'action sur fond clair | `--color-accent-cta` `#7a2c05` |
| Fond de page / panneau neutre | `bg` `#fafaf9` / `bg-elevated` `#f1f1ee` ; bordures `border` `#e2e1db` |
| Alerte | `alert` `#d6293e` ; confirmation `confirm` `#1b7a43` |
| Titres | Hanken Grotesk 700, `tracking-[-0.02em]`, interligne ~1,05 |
| Texte | Inter ; valeurs, axes, étiquettes : Hanken Grotesk en chiffres tabulaires (`font-mono` pointe maintenant dessus ; IBM Plex Mono n'est plus chargé) |

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
| Ligne « modèle · jeu de données » sous la prédiction | non | non | **retirée** (règle 9, faite dans `PredictionSummary` et `PredictionPanel`) |
| Machines : colonnes | Machine, Statut, Priorité | idem | **+ Température, Vibration, Pression** |
| Raccourcis | Conseils, Paliers tarifaires | idem | **Plan d'action, Historique des résolutions**, Paliers |

### PME, Ménage, Admin : IMPLÉMENTÉ (`pmeOverviewBlocks`, `menageOverviewBlocks`, `adminOverviewBlocks` dans `src/lib/overviewLevels.ts`)

Même gabarit (en-tête, `KpiStrip`, bloc prédiction + alertes, bloc résumé + raccourcis), d'après les planches `H-*` :

| Profil | Niveaux | Contenu proposé de la vue d'ensemble |
|---|---|---|
| **PME** (amateur par défaut) | 3 | `KpiStrip` (cibles : puissance/machines → `/app/equipements`, économies → `/app/facturation`, anomalies → `/app/alertes`) ; prédiction + alertes ; résumé des équipements déclarés (`Catégorie, Site, Statut` ; dès amateur `+ Marque, Modèle, Priorité`, comme aujourd'hui) ; raccourcis Conseils, Recommandations, Factures CIE, Facturation Nouankany. |
| **Ménage** (débutant, sans sélecteur) | 1 | Gabarit le plus court : `KpiStrip` avec « Économies estimées ce mois » (indicatif) ; prédiction + alertes ; « Dernière facture CIE » ; raccourcis Conseils, Recommandations, Abonnement, Paliers. Entrées « Abonnement » et « Rapports » dans sa navigation (après Factures). |
| **Admin** (technique par défaut) | 3 | `KpiStrip` télémétrie (base de données, uptime, latence 5 min, machines plateforme — provenance « télémétrie système ») ; alertes tous profils ; les 4 outils d'administration en raccourcis ; pas de `DemoDataBanner`. |

### Ce que change le niveau, écran par écran (tel que dessiné dans les planches `H-*`)

| Écran | Débutant | Amateur | Technique |
|---|---|---|---|
| Vue d'ensemble PME | équipements : Catégorie, Site, Statut | + Marque, Modèle, Priorité | idem amateur + raccourci « Plan d'action » |
| Vue d'ensemble Industrie | machines : Machine, Statut, Priorité | idem | + Température, Vibration, Pression ; raccourcis Plan d'action et Historique des résolutions |
| Vue d'ensemble Admin | identique | identique | identique (sans ligne « modèle ») |
| Équipements (PME) | Catégorie, Site, Statut | + Marque, Modèle, Priorité | idem amateur |
| Machines (Industrie) | Machine, Statut, Priorité | idem | + relevés ; texte explicatif « ce qui se passe sur chaque appareil » |
| Prédiction | valeur, graphique, par équipement | idem | + phrase expliquant la page (appareils, seuils, recalage) |
| Conseils / Recommandations | sans sévérité ni gain | sévérité (conseils), gain chiffré (recos) | idem amateur |
| Plan d'action (PME, Industrie) | gain restant + actions | idem | + **Historique des résolutions** |
| Audit (hors Ménage) | Heure, Action, Détail | + Acteur | + Source, filtres par famille, **Export CSV** (Admin : + colonne Compte) |
| Alertes, Conso & coûts, Factures, Facturation / Abonnement, Rapports, Journal, Paramètres | identiques à tous les niveaux | | |

Ménage : un seul niveau (débutant), pas d'Audit, pas de Plan d'action, pas de Machines/Équipements ; **a** une page Abonnement (paliers) et une page Rapports (PDF mensuel).
Ménage, **logements** (2026-10-20) : Paramètres, carte « Mes logements » (jamais le mot « site ») : un logement en Découverte
et Essentiel, jusqu'à trois en Optimum (refus du serveur affiché). Chaque logement : nom, type de compteur (à facture ou
à carte, rechargé), calibre du disjoncteur. Le formulaire d'appareil montre « Logement » seulement s'il y en a plusieurs.
PME et Industrie : « Type de compteur » par site dans la carte Sites.
**Droits des formules ménage** (décision du propriétaire, 2026-10-21) : Découverte (suivi, factures, compteur à carte,
rapport, alertes de sécurité sur le site) ; Essentiel (+ prédictions sur 2 appareils, facture prévue, seuils personnalisés,
alertes par email) ; Optimum (+ prédictions sur 4 appareils, assistant, conseils et « À vérifier », 3 logements). Un
écran non inclus montre `LockedFeature` (cadenas, formule qui l'inclut, lien « Voir les formules »), jamais un
chargement sans fin. Changement de formule par le client, immédiat, après confirmation (page Abonnement, dans le menu
principal du ménage) ; pas encore de paiement.
**Compteur à carte** (2026-10-20) : page Factures, une section par logement à carte (ancre `#prepaye-<id>`) : crédit
restant estimé (badge, rythme et point de départ dits), date limite de recharge (en rouge sous trois jours), prix
réellement payé par kWh (montant ÷ kWh des recharges, redevances et taxes comprises), recharges (à la main ou photo du
reçu, suppression confirmée), « J'ai lu mon compteur » pour corriger. Notification « Crédit bientôt épuisé » sous trois
jours, email sous deux (une fois par recharge). Les coûts de Conso & coûts et des rapports prennent le prix réel quand
tous les logements du compte sont à carte.

## 5. État écran par écran

Tous les écrans du tableau ci-dessous existent pour chaque profil, en filets (plus aucune page en cartes), avec les règles
de niveau indiquées. Les écrans livrés depuis le 2026-10-15 (Sources de mesures, Interventions, Documentation, registre
des Alertes, boîtier) ont été vérifiés dans un navigateur ; la conformité fine des autres écrans aux planches `H-*` n'a
pas été revérifiée écran par écran depuis le 2026-10-09.

| Écran (route) | Profils | Règle de niveau à conserver |
|---|---|---|
| Vue d'ensemble `/app/apercu` | tous | voir §4 |
| Alertes `/app/alertes` | tous (technicien : onglet Alertes en intervention) | retour « qu'avez-vous fait ? » selon le niveau (§13) |
| Machines `/app/machines` | Industrie | colonnes de mesures au niveau technique |
| Équipements `/app/equipements` | PME | colonnes complètes dès amateur |
| Conso & coûts, Factures CIE | Ménage, PME, Industrie | aucune |
| Prédiction `/app/prediction` | tous | détail du modèle au niveau technique (Admin seulement) |
| Conseils, Recommandations | Ménage, PME, Industrie | impact chiffré dès amateur |
| Facturation / Abonnement, Rapports | Ménage, PME, Industrie | contrat et relevés (PME, Industrie), paliers (Ménage) |
| Journal | Industrie, Admin | aucune |
| Audit `/app/audit` | PME, Industrie, Admin | colonnes et export selon le niveau (§4) |
| Plan d'action `/app/plan-action` | PME, Industrie | historique des résolutions au niveau technique |
| Sources de mesures `/app/sources` | PME, Industrie | §12 |
| Interventions `/app/interventions` | technicien | §12 |
| Documentation `/app/aide` | tous | §12 |
| Paramètres `/app/parametres` | tous | sélecteur de niveau (hors Ménage) |
| Admin : santé, modèles, utilisateurs, demandes d'audit, messages, impayés, boîtiers | Admin | aucune |

Pour chaque écran modifié : en-tête (titre + sous-titre court), filets au lieu de cartes, provenance sur
chaque donnée, états vides, mobile 390 px sans défilement horizontal. Contraste WCAG AA (4,5 pour le texte courant) : audit axe-core
des pages publiques sans aucune violation le 2026-10-17, après le passage du texte tertiaire à `#6e6e64`. **Ne pas changer** les règles de niveau
ci-dessus sans les mettre à jour dans ce fichier.

## 5 bis. Premiers pas, mouvement et vocabulaire du Ménage (demande du propriétaire, 2026-10-11)

- **Menu resserré du Ménage (partie H2, 2026-10-11)** : neuf entrées (Accueil, Premiers pas, Mes appareils, Ma consommation,
  Mes factures, Conseils, À surveiller, Mon boîtier, Paramètres). « Facture prévue », « Abonnement », « Rapports » et
  « Recommandations » n'ont plus d'entrée propre : elles portent `under` dans `navConfig.ts`, restent accessibles par leur
  adresse et s'ouvrent depuis l'accueil, « Mes factures » et « Conseils » (qui affiche aussi les recommandations). Le menu
  affiché vient de `visibleNav(profile)` ; PME, Industrie et Admin ne changent pas.
- **Imports (partie I, 2026-10-11)** : la facture s'envoie en photo ou en PDF ; « Importer plusieurs factures » (page Factures)
  et « Reprendre les données d'un autre compte » (Paramètres) suivent le même parcours : fichier, aperçu dans une modale,
  confirmation. Rien n'est enregistré avant la confirmation.
- **Premiers pas** (`/app/premiers-pas`, 2e entrée du menu de chaque profil) : les actions importantes du compte, chacune
  avec une phrase qui dit ce qu'elle fait. Étapes par profil dans `src/lib/gettingStarted.ts` (testé). Une étape se coche
  **d'après les données réelles du compte** (un site, un appareil, une facture envoyée…) ; une étape sans donnée mesurable se
  coche quand sa page a été ouverte. Aucune case cochée d'office. Un compte tout juste créé arrive sur cette page.
- **Rappel sur la vue d'ensemble** (`GettingStartedStrip`) : une ligne et une barre d'avancement, masquable, qui disparaît
  quand tout est fait. Elle ne remet pas en cause la règle 3 (la vue tient sur un écran).
- **Mouvement, dans les règles du §1** (ni dégradé, ni carte, ni ombre) : les blocs d'une page montent l'un après l'autre
  (`.stagger`, `.rise-in`), les barres d'un graphique poussent depuis la base (`.bar-grow`), la barre d'avancement s'anime.
  Tout est coupé par `prefers-reduced-motion`. S'applique aux quatre profils.
- **Ménage** : ses indicateurs parlent d'« appareils » et d'« à surveiller » (`MENAGE_LABELS` dans `src/api/kpis.ts`) ;
  PME, Industrie et Admin gardent « machines » et « anomalie ». Menu du Ménage resserré (dix entrées avec
  Documentation).

## 6. Décisions en attente (ne pas trancher sans le propriétaire)

1. ~~Part de 10 %~~ **Décidé, puis remplacé le 2026-10-08** : PME et Industrie paient audit, redevance et 40 % (30 à 50)
   des économies mesurées ; la landing continue de dire « Structure définie lors de l'audit ».
2. ~~Plan d'action et Audit~~ : maquettes validées, endpoints créés (PR NouanKanyAI#2, §9), branchés.
3. ~~KPI « Part sur les économies » pour le Ménage~~ **Remplacé le 2026-10-08** : le Ménage paie un abonnement par palier
   (Découverte gratuit, Essentiel, Optimum) ; le KPI devient « Économies estimées ce mois », indicatif.
4. ~~« Gratuit pour commencer »~~ **Décidé** : libellé retiré de la landing (offre pas encore ouverte). Aucun prix affiché pour
   la formule Ménage.
5. **Textes générés par le backend** : article manquant corrigé (« Éteignez l'appareil « Compresseur d'air » », PR NouanKanyAI#2).
   « Les capteurs de … montrent un comportement anormal » est **conservé** : le mot « capteur » reste permis quand il
   désigne un élément précis (décision du propriétaire).

**Décidé par le propriétaire :** encadré « Vos appareils » dans la barre latérale (validé) ; page Admin « Modèles &
observabilité » conservée ; aucune mention du modèle (nom, jeu de données) dans la Prédiction **côté client** à aucun niveau — les mentions de modèles restent dans le volet **Admin** (page « Modèles & observabilité » et, pour l'Admin seulement, nom du modèle sur la page Prédiction) ; planches `H-*`
validées. Le câblage frontend et la mise en ligne (frontend sur Vercel, backend sur Render) sont faits par Claude Code en local.

> Mise en ligne (Vercel, Render), données et tests après déploiement : voir `MISE_EN_LIGNE.md`.

## 7. Tester en local, avec le vrai backend

```bash
# 1) Backend (dépôt herverenard147/nouankanyai ; PostgreSQL requis)
DATABASE_URL=postgresql://… JWT_SECRET=… \
FRONTEND_URL=http://localhost:5173 AI_MODE=mock PORT=8001 python backend/main.py
# 2) Comptes et données de démonstration (script de la PR NouanKanyAI#1, idempotent)
python backend/scripts/seed_demo.py --with-alert --with-history   # + factures, équipe, plan, vérifications (PR NouanKanyAI#2)
python backend/scripts/promote_admin.py --email admin@nouankany.demo --role superadmin   # rôle admin : jamais automatique
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

## 8. Modales (maquettées pour chaque profil, sur la vraie page en arrière-plan)

| Action | Modale | Validation |
|---|---|---|
| Ajouter (machine/équipement, facture, membre d'équipe, action du plan) | formulaire, bouton « Ajouter… », rappel « enregistré dans l'Audit » | aucune |
| Modifier (machine/équipement, facture, action du plan, seuils d'alerte, profil, rôle utilisateur) | formulaire pré-rempli, bouton « Enregistrer » | **modale « Confirmer la modification ? »** : tableau *avant → après* des seuls champs changés, boutons « Retour » / « Confirmer la modification » |
| Supprimer (machine/équipement, facture, membre, action du plan) | **modale de suppression** : conséquences en liste, bouton rouge « Supprimer définitivement » ; pour une machine, saisir son nom pour confirmer | c'est elle-même la validation |
| Changer le mot de passe | formulaire (mot de passe actuel = validation) | pas de seconde modale |

Règles : `role="dialog" aria-modal`, focus piégé et rendu à l'élément déclencheur, `Échap` = Annuler, fond assombri,
bouton destructif en `alert`. Chaque confirmation écrit un événement dans l'Audit (§9). Corps de la modale :
mêmes champs que l'API (`POST/PATCH /api/machines`, `/api/bills`, `/api/alert-thresholds`, `/api/v1/team/members`,
`/api/v1/plan/items`, `PATCH /api/auth/me`, `PATCH /api/admin/users/{id}/role`).

## 9. Backend créé pour l'Audit, le Plan d'action et l'Historique des résolutions

PR `herverenard147/NouanKanyAI#2` (branche `claude/audit-plan-endpoints`, empilée sur la PR #1). 150 tests passent.

| Route | Rôle |
|---|---|
| `GET /api/v1/audit/events?category&since&until&q&limit&offset` | Piste d'audit du compte : `{total, items[], categories{famille: n}}`, ordre chronologique inverse |
| `GET /api/v1/audit/events.csv` | Export CSV (niveau technique), séparateur `;`, BOM pour Excel |
| `GET /api/v1/audit/admin/events?owner_id` | Piste de toute la plateforme (Admin) |
| `GET/POST /api/v1/plan/items`, `POST …/import`, `PATCH/DELETE …/{id}`, `GET …/summary` | Plan d'action du mois ; `import` reprend des recommandations de façon idempotente (`source_ref`) ; statuts `a_faire / en_cours / fait / abandonne` |
| `GET /api/v1/plan/resolutions` | Historique des « Vérifier et résoudre » (écrit par `POST /api/machines/{id}/test`) |
| `PATCH /api/bills/{id}` | Modifier une facture (la modale « Modifier » n'avait pas d'endpoint) |

Familles d'audit : `compte, connexions, sites, machines, resolutions, factures, seuils, equipe, plan`. La piste est
append-only ; un membre d'équipe écrit dans la piste de son propriétaire, l'acteur reste la vraie personne.
**Limites** : pas de rétro-remplissage (les événements antérieurs au déploiement n'existent pas) ; l'écriture ne bloque
jamais l'action métier ; les gains du plan sont des **estimations** du moteur, jamais des économies mesurées ; les
heures sont en UTC.

Côté frontend, tout est branché : `src/api/audit.ts`, `src/api/actionPlan.ts`, pages `AuditPage` et `PlanActionPage`,
composant `Modal` et ses confirmations, espace fine insécable (U+202F) dans `formatters.ts`.

## 10. Boîtier (page publique `/le-boitier`, annonce sur l'accueil)

Maquettes : planches `I`, `I2` (page) et `J` (annonce + navbar) du canvas. Code : `src/components/boitier/`,
`src/pages/boitier/BoitierPage.tsx`, `src/pages/landing/sections/BoitierSection.tsx`.

- **Quatre lumières** (`boitierStates.ts`) : vert « tout va bien », orange « un appareil s'approche de son seuil »
  (validé par le propriétaire), rouge « un appareil dépasse son seuil », **blanc pulsé = le boîtier écoute**. Le vert
  n'est jamais utilisé pour l'écoute, sinon un boîtier qui écoute pendant une alerte rouge passerait un instant au vert.
- **Vue 3D** : le modèle du prototype (`public/models/boitier-nouankany.glb`), chargé à la demande, sur l'accueil et la
  page boîtier ; rotation par glisser (même vitesse sur les deux pages), vue éclatée et clic sur les pièces sur la page
  boîtier. Image fixe du prototype pendant le chargement et sans WebGL. `prefers-reduced-motion` : pas de balancement ni
  de pulsation.
- **Échanges affichés** : exemples d'illustration, sans aucun chiffre (test `boitier.test.tsx`). La liste des formulations
  comprises (`BOITIER_PHRASES`) doit rester alignée avec le routeur d'intentions du backend quand il existera.
- **Pas d'annonce du SIREX** sur le site. Aucune modification de la landing côté Ménage (présenté au hackathon).
- **Page de démonstration** : la page publique n'appelle pas le backend. Les routes `/api/v1/boitier/*` existent et
  servent le tableau de bord (§11) et les vrais boîtiers.

## 11. Boîtier dans le tableau de bord (`/app/boitier`, `/app/admin/boitiers`)

Parcours décidé par le propriétaire : un compte n'a **aucun boîtier** au départ. Il en **demande** un (prix affiché dans la
demande, 35 000 FCFA par boîtier, venu du backend et figé à la demande), le **reçoit**, puis **demande son code** de connexion
et le saisit sur le boîtier. Dès qu'il y en a un, la page devient la **liste** ; chaque ligne ouvre la **fiche**.

- Écrans : vide → demande (fenêtre) → « en attente de livraison » → code (formulaire puis code affiché une seule fois) →
  liste → fiche. Maquettes dans le canvas, planches `H-Menage-Boitier-*`, `H-PME-Boitier-*`, `H-Admin-Boitiers-*`.
- Niveaux (`src/lib/boitierLevels.ts`) : le débutant voit nom, lumière, connexion ; l'amateur ajoute site, portée, dernière
  activité et le choix des appareils éteignables ; le technique ajoute langue, identifiant, dernier relevé, canal, détails.
  Le ménage n'a qu'un niveau (débutant) mais voit la liste de ses appareils.
- Un compte sans site (ils naissent avec les machines) le crée dans la fenêtre de demande ou de code.
- Admin : demandes à livrer (« Marquer comme livré », tracé dans l'Audit du compte), liste de tous les boîtiers, fiche avec
  révocation. Au départ, ni demande ni boîtier.
- Provenance : l'état du boîtier vient de relevés simulés tant qu'aucun capteur réel n'est branché, donc « synthétique ».
- Pas encore branché : l'écran de demande n'impose pas qu'une demande ait été livrée avant de demander un code (volontaire :
  le propriétaire peut vouloir créer des boîtiers de test à la main).
- Pas d'écran Industrie : boîtier ou tablette, décision en attente.

## 12. Sources de mesures, accès technicien, documentation (2026-10-16)

- **Sources de mesures** `/app/sources` (PME, Industrie) : liste des boîtiers, passerelles, logiciels et dépôts de fichiers ;
  « Ajouter une source » demande « Comment vos mesures peuvent-elles nous arriver ? » (5 choix), puis nom et site, puis
  le code d'appairage ou l'identifiant et la clé (affichés une fois). Fiche `/app/sources/:id` selon le type : compteurs
  de la passerelle (essai, nouvel essai, retrait), clé et noms du logiciel, réglage des colonnes et historique des fichiers.
  Formulaires purs dans `src/lib/sourceForms.ts` (testés).
- **Accès technicien** : panneau sur Sources de mesures et dans Paramètres (titulaire du compte). Profil `technicien`
  (`platform_role`) : menu Interventions, Documentation, Paramètres ; `/app/interventions/:accountId` ouvre l'installation
  du client, l'en-tête `X-Intervention-Compte` part seul sur les routes d'installation (`apiClient`, `interventionStore`).
- **Documentation** `/app/aide`, entrée « Documentation » dans le menu de **chaque** profil (le ménage passe à dix entrées,
  décision du propriétaire). Un guide par acteur (`src/data/aide/guides.ts`) et les messages d'erreur expliqués
  (`src/data/aide/erreurs.ts`) ; tout message reconnu à l'écran porte « Que faire ? » vers sa fiche (`ApiErrorMessage`).
  À tenir à jour avec le backend : un nouveau message d'erreur = une fiche.

## 13. Alertes et capteurs d'appareils (2026-10-16)

- **Registre** `/app/alertes` : alertes ouvertes, « Dépassements prévus » à part, historique jamais effacé avec la cause de
  fermeture. Une alerte terminée sans cause connue demande « qu'avez-vous fait ? » : questions courtes au niveau débutant,
  détail (coût, arrêt) au niveau technique ; « Plus tard » la masque pour la visite. Libellés dans `src/lib/alertRegistry.ts`.
- **Notification** : `AlertNotifier` (clients seulement, hors intervention) relit les alertes ouvertes chaque minute tant
  que l'onglet est visible ; une alerte apparue pendant la visite s'annonce dans un bandeau avec un lien « Voir ». Rien au
  premier chargement.
- **Cloche des notifications** (2026-10-18, `NotificationBell`) : à droite de la barre du haut et en tête du menu
  (ordinateur et tiroir mobile), elle mène à `/app/alertes` et porte le même compteur que l'entrée du menu (alertes à
  traiter pas encore vues). Absente pour le technicien, qui n'a pas de page d'alertes.
- **Technicien** : onglet Alertes en intervention (`InterventionAlertsPage`) ; ses réponses portent « documentée par un
  technicien Nouankany ».
- **Capteur d'un appareil** : ajouté depuis la fiche de l'appareil ; état du capteur, essai, coupure réelle quand il a un
  relais. Une machine arrêtée s'affiche « Éteint ».
