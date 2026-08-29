# Handoff : NouanKanyAI — Landing page et Dashboard (4 profils)

## Vue d'ensemble

Deux livrables de design pour la plateforme NouanKanyAI (prédiction et maîtrise de la
consommation électrique, Côte d'Ivoire, MVP logiciel sans capteur déployé) :

1. **Landing page publique** : hero, preuve visuelle, constat chiffré, segments utilisateurs,
   à-propos, engagement de provenance des données, formules, capture email, footer.
2. **Dashboard applicatif** : un seul design system, quatre profils (Ménage, PME, Industrie,
   Portail Admin) plus un écran mobile Ménage. Le contenu et l'ordre de priorité changent
   selon le profil, jamais les composants ni les couleurs.

## À propos des fichiers de design

Les fichiers de ce dossier sont des **références de design réalisées en HTML** : des
prototypes qui montrent l'apparence et le comportement attendus, **pas du code de
production à copier tel quel**. Le travail attendu est de **recréer ces designs dans
l'environnement du codebase cible** (React, Vue, Next, SwiftUI, natif…) avec ses patterns
et ses librairies existants. Si aucun environnement n'existe encore, choisir le framework
le plus adapté au projet (React + Vite ou Next.js sont des choix sûrs ici, l'application
étant une SPA de dashboard avec une landing statique) et y implémenter les designs.

Les fichiers `.dc.html` s'ouvrent directement dans un navigateur. Ils utilisent un runtime
de composants maison (`support.js`) : un template HTML avec des trous `{{ valeur }}`, des
boucles `<sc-for>`, des conditions `<sc-if>`, et une classe de logique JavaScript qui
expose les données. **Ne pas porter ce runtime.** Lire le template comme du JSX et la
classe de logique comme un composant à état.

## Fidélité

**Haute fidélité (hifi).** Couleurs, typographie, espacements, rayons, états de survol et
hiérarchie sont définitifs et doivent être reproduits fidèlement. Les seules zones
volontairement non finalisées sont les photos (placeholders rayés avec la légende de ce
qu'il faut y déposer) et les pages légales (CGU, politique de confidentialité), à rédiger
séparément avec un juriste.

---

## Principe produit non négociable

> Une donnée est mesurée, estimée, ou synthétique. Jamais inventée.

Conséquences pour l'implémentation :

- **Chaque valeur affichée porte un badge de provenance.** Aucune exception, ni dans le
  dashboard, ni dans les graphiques, ni dans les extractions OCR.
- **Le badge `mesuré` n'apparaît nulle part** dans l'état actuel du produit : aucun capteur
  IoT n'est déployé. Le composant doit néanmoins supporter cette valeur, prête à être
  activée site par site quand un capteur sera installé.
- Trois valeurs utilisées aujourd'hui : `estimé` (dérivé de la facture CIE et des
  équipements déclarés), `synthétique` (sortie de modèle entraîné sur données synthétiques),
  `télémétrie système` (métriques d'infrastructure de l'Admin, ni produit ni modèle).
- Aucune promesse de temps réel dans les libellés. Le rail latéral rappelle en permanence
  qu'aucun capteur n'est déployé.

## Règles de copywriting à respecter dans tout nouvel écran

- Pas de tiret cadratin dans le corps de texte. Phrases courtes, points, virgules.
- Pas de badge pilule arrondi au-dessus des titres (pattern SaaS générique).
- Pas de promesse générique « IA / temps réel / rentabilité maximale » sans ancrage concret.
- Toute accroche décrit une action réelle du produit (photo de facture → OCR → prédiction →
  recommandation).
- Aucun témoignage : le produit n'a pas encore d'utilisateurs payants. La section « bientôt
  disponible » avec capture email tient ce rôle.

---

## Design tokens

### Couleurs

| Rôle | Hex | Usage |
|---|---|---|
| Fond | `#FAFAF9` | Fond général et fond des cartes de contenu du dashboard |
| Fond surélevé | `#F1F1EE` | Sections alternées, en-têtes de table, fond du desk dashboard |
| Blanc carte | `#FFFFFF` | Cartes de premier plan |
| Texte principal | `#1C1F1B` | Anthracite chaud, jamais noir pur |
| Texte secondaire | `#55584f` | Sous-titres, légendes. Contraste 6.95:1 sur fond, AA validé |
| Texte tertiaire | `#8a8a80` | Graduations d'axes, mentions de source |
| Ligne / bordure | `#E2E1DB` | Séparateurs, bordures de carte |
| Accent | `#E8590C` | Barres de graphique, fonds décoratifs. **Jamais en texte sur fond clair** |
| Accent texte / CTA | `#7a2c05` | Couleur réelle des boutons, rubans, barre survolée. Contraste 9.59:1, AA |
| Accent CTA survol | `#5c2104` | Survol des boutons primaires |
| Alerte | `#D6293E` | Uniquement les vraies urgences nécessitant une action humaine |
| Confirmation | `#1B7A43` | Validations, économies, actions auto-exécutées, badge `mesuré` |
| Fond confirmation | `#eaf4ee` | Fond des cartes d'action auto-exécutée et du badge `mesuré` |
| Badge estimé | `#7a5b0d` sur `#f7efd8` | Contraste 5.49:1, corrigé après audit AA |
| Badge synthétique | `#5b5f6e` sur `#eceef2` | Neutre |
| Paliers tarifaires | creuses `#e7efe9` · pleines `#fbe6d3` · pointe `#f7c9c9` | Barre de paliers CIE |
| Placeholder photo | trame `#EFEEE9` / `#F5F4F0`, bordure `#C9C7BE` pointillée, texte `#8a8a80` | Emplacements photo |
| Fond sombre | `#1C1F1B`, texte `#c7c7c0`, champ `#262922`, bordure champ `#3a3d37` | Bloc newsletter, infobulles |

Interdits explicites : fond crème + terracotta pastel, fond near-black + accent néon,
gradients décoratifs, blobs de fond.

### Typographie

- Titres : **Space Grotesk** 500 / 600 / 700, `letter-spacing: -0.01em`
- Corps : **Inter** 400 / 500 / 600, `line-height: 1.5`
- Chiffres, unités, libellés techniques, axes : **IBM Plex Mono** 500 / 600, toujours
  `font-variant-numeric: tabular-nums`

Échelle utilisée (landing) : h1 2.7rem/1.08 · h2 de section 1.9rem · h2 secondaire 1.7rem ·
h3 carte 1.25rem · lede 1.08rem · corps 0.94–1.02rem · légende 0.8–0.88rem · mono badge
0.7rem · mono axe 0.66–0.68rem.

Échelle dashboard : titre de vue 1.22rem · titre de section 1rem · titre d'alerte 1.16rem ·
valeur KPI 1.62rem mono · valeur de prédiction 1.9rem mono · corps 0.86–0.94rem ·
mono badge 0.7rem.

### Rayons de bordure (après la demande « plus arrondi, moins professionnel »)

| Élément | Valeur |
|---|---|
| Cartes de contenu, KPI, alertes, tables, panneaux, graphiques du constat | `20px` |
| Cartes segment (landing) | `24px` |
| Cartes de pricing | `26px` |
| Bloc newsletter | `28px` |
| Panneau assistant | `22px` |
| Boutons, champs, lignes de badge, pastilles de nav | `14px` |
| Barre de paliers tarifaires | `12px` |
| Haut des barres de graphique | `4px 4px 0 0` sur la landing, `12px 12px 0 0` dans le dashboard (`9px` en mobile) |
| Infobulle de graphique | `8px` sur la landing, `10px` dans le dashboard (`9px` en mobile) |
| Badges de provenance et pills de niveau | `99px` |
| Cadre du téléphone (maquette mobile) | `26px` |

### Espacements

Grille de 4 px. Valeurs réellement utilisées : 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26,
28, 32, 40, 44, 48, 56, 64. Sections de landing : `padding: 64px 0`. Contenu dashboard :
`padding: 28px 28px 120px` (la marge basse de 120 px évite que l'assistant flottant ne
recouvre le dernier bloc). Largeur de contenu landing : `max-width: 1120px`, gouttières
24 px. Largeur du dashboard : `max-width: 1440px`. Rail latéral : `244px`.

### Ombres

- Carte segment au survol : `0 10px 24px rgba(28,31,27,0.08)` + `translateY(-3px)`
- Carte de pricing mise en avant : `0 12px 28px rgba(232,89,12,0.12)` + `translateY(-6px)`
- Panneau assistant : `0 14px 34px rgba(28,31,27,0.14)`
- Cadre du téléphone : `0 18px 40px rgba(28,31,27,0.12)`

### Accessibilité, à ne pas régresser

- Boutons et rubans : texte blanc sur `#7a2c05`, jamais sur `#E8590C`.
- Padding vertical des boutons : 13 px minimum, hauteur réelle ~44 px. Cibles tactiles
  mobiles : 44 px minimum, 48 px pour le bouton assistant.
- `outline: 2px solid #E8590C; outline-offset: 2px` sur `:focus-visible` de tous les liens,
  boutons et champs.
- `@media (prefers-reduced-motion: reduce)` neutralise animations et transitions.
- Aucun `<img>` avec `src` vide : soit une vraie image, soit pas d'attribut `src`.

---

## Signature visuelle (trois éléments récurrents, à ne pas retirer)

1. **Barre de paliers tarifaires CIE** : trois segments horizontaux (creuses `flex:1.3`,
   pleines `flex:1.6`, pointe `flex:1`), hauteur 34 px, bordure `#E2E1DB`, rayon 12 px,
   libellés mono 0.68rem centrés. Présente dans le hero de la landing, dans le bloc KPI
   des trois vues utilisateur, et en version compacte (28 px, sans libellés internes) sur
   mobile.
2. **Badge de provenance** : pastille `border-radius: 99px`, padding `4px 9px`, mono 0.7rem
   600, avec une puce de 6 px en `currentColor` avant le texte. Une variante par valeur.
3. **Sélecteur de niveau** : trois pills `débutant / amateur / technique`. Actif =
   `#1C1F1B` fond, texte blanc. Inactif = bordure `#E2E1DB`, texte `#55584f`. Sur la
   landing il est illustratif dans les cartes segment ; dans le dashboard il est **actif et
   modifiable à tout moment**, dans la barre supérieure.

---

## Écran 1 : Landing page (`Landing.dc.html`)

Largeur de contenu 1120 px, gouttières 24 px. Toutes les grilles multi-colonnes sont en
`repeat(auto-fit, minmax(N, 1fr))` : hero 320 px, cartes 260 px, à-propos et engagement
300 px, footer 180 px. Les liens de navigation sont masqués sous 1100 px de viewport
(le header reste sur une seule ligne, les deux CTA restent visibles).

Ordre des sections :

1. **Nav sticky** — fond `rgba(250,250,249,0.92)` + `backdrop-filter: blur(8px)`, bordure
   basse. Logo 34 px + wordmark Space Grotesk 700 1.05rem. Cinq ancres. Deux CTA :
   « Se connecter » (ghost) et « Essayer gratuitement » (primaire).
2. **Hero** — h1 « Prenez en photo votre facture CIE. On s'occupe du reste. » (`max-width:
   12ch`), lede, deux CTA, note « Zéro investissement de départ. ». À droite, carte de
   grille tarifaire : titre mono en capitales, valeur `87 FCFA/kWh`, barre de paliers,
   légende, pied séparé par un filet pointillé avec « Prédiction hebdomadaire » et le badge
   `synthétique`.
3. **Preuve visuelle** — trois placeholders photo 4:3 (facture photographiée au téléphone,
   compteur CIE cadrage serré, devanture ou intérieur PME à Abidjan).
4. **Le constat** — kicker, h2 « Une hausse structurelle, pas un accident », paragraphe,
   puis **trois mini-graphiques à axes** (voir « Graphiques » plus bas), cartes de 20 px de
   rayon, en-tête « valeur mono 1.5rem `#1C1F1B` + unité de l'axe Y 0.72rem `#55584f` » :
   `79 → 87` FCFA/kWh tarif moyen 2023–2024 (deux colonnes, axe Y 0–100) ·
   `×2` écart creuses/pointe (trois colonnes d'indice 1 / 1,5 / 2) ·
   `6,5%` croissance annuelle de la demande 2025–2030 (six colonnes d'indice base 100 à
   137, axe Y tronqué à 96 pour rendre la pente lisible). Chaque carte porte sa source en
   mono, jamais un badge de provenance : ce sont des chiffres de plan d'affaires, pas des
   données produit.
5. **Pour qui** — trois cartes segment (photo 150 px en haut, tag mono, titre, description,
   sélecteur de niveau en pied avec le niveau par défaut du profil actif). Survol :
   `translateY(-3px)` + ombre, transition 0.15s ease.
6. **Qui sommes-nous** — placeholder photo 4:3 à gauche (équipe au travail ou hackathon
   FORPRODE), texte à droite.
7. **Notre engagement** — bande `#F1F1EE` bordée haut et bas. À gauche le titre « Une donnée
   est mesurée, estimée, ou synthétique. Jamais inventée. » ; à droite trois lignes
   blanches, une par valeur de provenance, avec sa définition.
8. **Formules** — trois cartes. ECO Essentiel 5 000 FCFA/mois, ECO Intelligent 12 000
   (mise en avant : bordure `#E8590C`, ombre orange, `translateY(-6px)`, ruban « Le plus
   choisi » sur `#7a2c05` centré à `top:-13px`), ECO Premium 25 000. Quatre bénéfices par
   carte avec une puce SVG cochée (`#1B7A43`, `#E8590C` sur la carte mise en avant).
9. **Newsletter** — bloc `#1C1F1B`, rayon 28 px, kicker « Bientôt disponible », titre,
   paragraphe, champ email + bouton « Me prévenir ». `preventDefault` sur submit dans la
   maquette : à brancher sur le vrai service d'emailing.
10. **Footer** — quatre colonnes (marque + note, Produit, Entreprise, Légal), filet, mention
    « © 2026 NouanKanyAI. Projet issu du Global AI Hackathon 2026. ». Les deux liens légaux
    pointent vers des pages **à rédiger**.

## Écran 2 : Dashboard (`Dashboard.dc.html`)

Un seul shell pour les quatre profils. Le sélecteur de vue en haut du fichier est un
**outil de maquette**, pas un composant produit : en production, le profil vient du compte
utilisateur.

### Shell

- **Rail latéral gauche** 244 px, fond `#FAFAF9`, bordure droite. Logo + wordmark, puis les
  entrées de nav : pastille 22 px (bordure `#E2E1DB`, fond blanc, initiale mono 0.65rem) et
  libellé 0.89rem. Entrée active : fond `#F1F1EE`, texte `#1C1F1B`, poids 600. Hauteur de
  ligne 44 px. En pied du rail, encart permanent « Capteurs IoT : aucun capteur déployé ».
- **Barre supérieure** : titre de vue, sous-titre (site, abonnement, formule), sélecteur de
  niveau actif, horodatage du dernier calcul en mono.
- **Colonne de contenu** : `padding: 28px 28px 120px`, sections séparées de 28 px.
- **Widget assistant** : `position: fixed`, ancré à 36 px / 28 px du bord bas droit,
  `z-index: 30`. Présent sur les trois vues utilisateur, absent de l'Admin. **Replié par
  défaut** : bulle pilule `#1C1F1B` de 48 px de haut, puce orange 9 px, libellé « Assistant
  NouanKanyAI », survol `#7a2c05`. Au clic, un panneau de 306 px s'ouvre au-dessus de la
  bulle : en-tête avec le contexte équipements et une croix de fermeture, message, badge
  `synthétique`, champ + bouton « Envoyer ». État `assistantOpen` dans la logique. Le
  panneau ne doit jamais être ouvert par défaut : il recouvrirait la carte d'alerte, qui
  doit rester l'élément dominant.

### Hiérarchie de l'information, ordre non négociable

**1. Alerte active** → **2. KPI de consommation et coût** → **3. Prédiction IA**, puis les
blocs propres au profil. L'alerte n'est pas un badge discret : c'est le bloc dominant de la
page.

Deux registres visuellement séparés, **jamais mélangés dans la même liste** :

- **Action humaine requise** : carte blanche, `border-left: 5px solid #D6293E`, disque
  rouge 34 px avec « ! », sur-titre mono rouge « ACTION HUMAINE REQUISE », niveau de seuil
  ou score de sévérité, titre 1.16rem, détail, badge de provenance + base de calcul, bouton
  primaire d'action.
- **Action automatique déjà exécutée** : bloc `#eaf4ee`, bordure `#1B7A43`, sous un
  intertitre mono explicite « Registre distinct : actions automatiques déjà exécutées ».
  Pastille blanche `auto-exécutée`, titre, détail, horodatage, lien « Voir le journal ».
  Aucun bouton d'action : rien n'est attendu de l'utilisateur.

### Contenu par vue

**Ménage** (niveau par défaut : débutant) — nav : Vue d'ensemble, Alertes, Conso & coûts,
Prédiction, Factures, Conseils, Paramètres. Une alerte de seuil global unique (200 kWh,
projection 216 kWh). Trois KPI : consommation du mois 142 kWh, coût projeté 18 800 FCFA,
part en heures de pointe 29 %. Barre de paliers. Prédiction hebdomadaire 38 kWh, intervalle
32 à 44. Trois conseils classés par impact (−9 %, −6 %, −2 %). Upload facture CIE avec
extraction OCR. Assistant contextualisé chauffe-eau et climatisation.

**PME** (amateur) — nav : + Équipements, Rapports. Une alerte par appareil (vitrine
réfrigérée 41 % au-dessus du profil déclaré) **et** une action auto-exécutée journalisée
(décalage du préchauffage du four, hier 21:42). Quatre KPI, dont part heures de pointe 34 %
et impact estimé sur la marge −2,1 points. Prédiction hebdomadaire 1 305 kWh. Conseils
priorisés par impact sur la marge. Table équipements : catégorie, marque, modèle, site,
priorité, statut, provenance. Upload facture + analyse média équipement.

**Industrie** (technique) — nav : + Machines, Anomalies, Journal. Alerte multi-niveaux
(avertissement 70 %, critique 90 %, urgence 100 %) : Ligne 2 à 92 % du contrat, score de
sévérité Isolation Forest 0,82, et délestage préventif auto du compresseur C-3 journalisé.
Cinq KPI. Prédiction de charge 3 420 kWh/jour. Table machines : température, vibration,
pression, statut, priorité, provenance. Plan d'action mensuel chiffré en FCFA. Historique
des résolutions d'anomalies (date, anomalie, ce qui l'a résolue, sévérité).

**Portail Admin** — pas d'assistant. Alerte d'action humaine (certificat d'API expirant
dans 6 jours). Quatre KPI plateforme : base de données connectée, uptime 14 j 06 h, latence
moyenne 218 ms et p95 512 ms, **toujours avec la fenêtre glissante et le compteur
d'échantillons visibles** (15 min, 1 842 échantillons), badge `télémétrie système`. Trois
panneaux : XGBoost (R² 0,912, MAE 4,2 kWh, MAPE 6,8 %, badge `dataset: synthetic`),
Isolation Forest (27 anomalies, sévérité moyenne 0,46, max 0,82), Gemini (1 204 appels,
38 % de cache hits, 0 saturation, latence 740 ms, badge `mode mock : désactivé`). Journal
d'activité agrégé : heure, type, détail, compteur.

**Rendu dégradé (à implémenter, non montré dans la maquette)** : jamais d'écran d'erreur
global. Chaque métrique indisponible affiche son propre état « indisponible » dans sa
carte, en conservant son titre et sa mention de fenêtre.

**Mobile Ménage** — colonne 390 px : barre d'état, marque + sélecteur de niveau, carte
d'alerte, deux KPI côte à côte, barre de paliers compacte, prédiction avec graphique
tactile, trois conseils, encart d'envoi de facture, bouton assistant pleine largeur 48 px.

---

## Graphiques

Même grammaire dans les deux fichiers. Pas de librairie externe : des `div` en flex.

- **Axe des ordonnées** : colonne de trois graduations mono 0.66–0.68rem `#8a8a80`, en
  `justify-content: space-between`, alignées à droite, avec un `padding-bottom` égal à la
  hauteur de la bande des libellés d'abscisse (22 à 26 px) pour que la graduation `0`
  tombe exactement sur l'axe.
- **Cadre** : `border-left` et `border-bottom` `1px solid #E2E1DB` sur le conteneur des
  barres.
- **Barres** : largeur fixe et sobre, `flex: 0 1 32px` sur la landing (rayon haut 4 px),
  `flex: 1` dans le dashboard (rayon haut 12 px). Hauteur en pourcentage de la valeur
  maximale, couleur `#E8590C`. Les barres sont groupées à gauche de l'axe avec un écart
  constant par graphique (30 px pour deux barres, 26 px pour trois, 12 px pour six), jamais
  étalées sur toute la largeur : les colonnes doivent rester étroites et régulières. Un axe
  Y peut être tronqué (le graphique de croissance part de 96) : le dire par les graduations,
  jamais laisser croire que la base est zéro.
- **Abscisses** : libellé mono en `position: absolute; bottom: -20/-22px`.
- **Interaction desktop** : `mouseenter` / `mouseleave` sur la colonne. La barre survolée
  passe en `#7a2c05` et une infobulle `#1C1F1B` texte blanc mono 0.7rem apparaît au-dessus
  (`opacity` 0 → 1, transition 0.12s ease, `pointer-events: none`).
- **Interaction mobile** : `click` sur la colonne bascule l'infobulle (une seule ouverte à
  la fois). Le `click` est aussi câblé sur desktop pour épingler une valeur.
- Sur la landing, chaque carte de graphique affiche l'unité de l'axe Y en haut à droite et
  une ligne « axe des abscisses : … · source : … » en pied.
- Dans le dashboard, la carte de prédiction affiche la valeur, l'intervalle, le badge
  `synthétique`, la mention `XGBoost · dataset: synthetic`, puis le graphique et la ligne
  « axe des ordonnées : … · axe des abscisses : jour · survol pour la valeur ».

## Interactions et états

| Élément | Comportement |
|---|---|
| Liens de nav landing | `color: #55584f` → `#1C1F1B` au survol ; masqués sous 1100 px |
| Bouton primaire | `#7a2c05` → `#5c2104` au survol |
| Bouton ghost | fond transparent → `#F1F1EE` au survol |
| Carte segment | `translateY(-3px)` + ombre, 0.15s ease |
| Sélecteur de niveau (dashboard) | état applicatif, persistant, modifiable à tout moment |
| Sélecteur de vue (maquette) | à remplacer par le profil du compte en production |
| Barre de graphique | survol : couleur + infobulle ; clic : bascule l'infobulle |
| Formulaire newsletter | `preventDefault` dans la maquette, à brancher |
| Champ assistant | non fonctionnel dans la maquette, à brancher sur l'API |

## État applicatif nécessaire

- `profile` : `menage | pme | industrie | admin`, issu du compte.
- `level` : `debutant | amateur | technique`, valeur par défaut suggérée par le profil,
  modifiable à tout moment depuis le dashboard, persistée côté utilisateur.
- `hoveredBarIndex` : index de la barre survolée ou épinglée, ou `null`.
- Données par vue, chacune accompagnée de sa provenance : alertes (deux registres séparés),
  KPI, prédiction (valeur, intervalle, série journalière, métadonnées de modèle),
  conseils, équipements ou machines, plan d'action, historique de résolutions, extraction
  OCR, métriques admin, journal d'activité.
- Récupération : un appel par bloc plutôt qu'un appel global, pour que le rendu dégradé de
  l'Admin puisse afficher un état « indisponible » carte par carte.

## Assets

- `logo.png` — logo fourni par le client, détouré (fond blanc rendu transparent, marges
  recadrées, sortie carrée 892 px). Utilisé en 34 px dans la nav landing, 26 px dans le
  footer, 32 px dans le rail dashboard, 26 px dans l'en-tête mobile. Remplace l'ancienne
  pastille orange « NK ». Fournir aussi une version SVG si elle existe.
- Polices : Space Grotesk, Inter, IBM Plex Mono, chargées depuis Google Fonts.
  À auto-héberger en production.
- Sept photos à sourcer, actuellement en placeholder rayé avec la légende de ce qu'il faut
  y déposer : facture CIE photographiée au téléphone ; compteur électrique CIE cadrage
  serré ; devanture ou intérieur de petit commerce à Abidjan ; intérieur de foyer ivoirien ;
  gérant(e) de PME en activité ; technicien devant un tableau électrique industriel ; équipe
  fondatrice ou hackathon FORPRODE. Aucune photo stock générique (open-space, poignée de
  main, sourire face caméra) : du réel local, quitte à le photographier au téléphone.
  Format conseillé : 4:3, 640×480 px minimum, JPEG optimisé sous 200 ko.

## Modifications appliquées dans cette itération

1. Logo client détouré et intégré partout, en remplacement de la pastille orange « NK ».
2. Rayons de bordure augmentés sur l'ensemble des cartes, boutons, champs et barres de
   graphique, pour un rendu volontairement moins institutionnel.
3. Placeholders photo conservés partout, y compris ceux placés à gauche d'un contenu
   (section « Qui sommes-nous » de la landing, bloc « Aperçu photo » de la carte OCR du
   dashboard) : ils avaient été retirés puis rétablis à la demande du client.
4. Section « Le constat » de la landing refaite : les trois chiffres bruts sont devenus
   trois mini-graphiques à axes, avec valeur au survol et mention de source. Les libellés
   d'origine sont conservés mot pour mot.
5. Graphique de prédiction du dashboard doté d'axes gradués, d'un cadre et d'infobulles au
   survol. Version mobile équivalente, valeurs au toucher.
6. Correctifs de responsive de la landing : grilles en `auto-fit`, liens de nav masqués sous
   1100 px.
7. Correctifs du dashboard : assistant passé en ancrage viewport, replié par défaut en bulle
   pour ne plus recouvrir la carte d'alerte, marge basse de sécurité de 120 px, badge de
   provenance ajouté sur les KPI système de l'Admin, en-têtes de colonnes des tables et
   métriques des panneaux Admin réparés.
8. Graphiques du constat resserrés : colonnes étroites de 32 px à écart constant, rayon de
   barre ramené à 4 px, en-tête de carte sur une seule ligne, valeur en anthracite plutôt
   qu'en orange, ligne de source unique en pied.

## Reste à faire côté produit

- Sourcer les sept photos.
- Rédiger les CGU et la politique de confidentialité (conformité RGPD et loi ivoirienne sur
  les données personnelles), idéalement avec un juriste local.
- Brancher la capture email, l'upload de facture, l'OCR et l'assistant sur les vrais
  services.
- Implémenter le rendu dégradé par métrique du Portail Admin.
- Prévoir l'activation du badge `mesuré`, site par site, à l'installation des premiers
  capteurs.

## Fichiers de ce dossier

| Fichier | Contenu |
|---|---|
| `Landing.dc.html` | Landing page complète |
| `Dashboard.dc.html` | Dashboard, quatre profils + écran mobile Ménage |
| `support.js` | Runtime des fichiers `.dc.html`. Nécessaire pour les ouvrir dans un navigateur, à ne pas porter |
| `logo.png` | Logo détouré, fond transparent |
| `nouankanyai-design-brief.md` | Brief de design system et de contenu d'origine |
