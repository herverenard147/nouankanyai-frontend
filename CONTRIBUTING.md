# Contribuer à Nouankany (frontend)

Ce document fixe les règles non négociables du projet. En cas de doute, lire
d'abord `docs/PASSATION_GEMINI.md` du dépôt backend.

## 1. Avant d'écrire du code
- Lance les tests et note le nombre exact de tests qui passent. Référence actuelle :
  `docs/SUIVI_TECHNIQUE.md` du dépôt backend (section « Tests de référence »), et la valeur de
  `.github/test-baseline.json`.
- Crée une branche dédiée au format feat/..., fix/..., docs/..., data/... (une branche, une PR par sujet).
- Ne travaille jamais directement sur main (Vercel redéploie `main`). Les PR visent `main`.
- Travaille dans une copie séparée (`git worktree`) partant de `origin/main`.

## 2. Avant d'ouvrir une PR
- Tous les tests passent (au moins le même nombre qu'à la référence), ainsi que `tsc -b`, le lint et le build.
  La CI GitHub étant suspendue jusqu'au 1er novembre 2026, les lancer en local (`outils_tests/tests_locaux.sh`
  dans le dossier `Nouankany/`, hors dépôt).
- Les nouveaux comportements ont leurs propres tests.
- Toute PR qui augmente le nombre de tests passés doit mettre à jour la valeur
  correspondante dans `.github/test-baseline.json`, dans la même PR. Le garde-fou
  CI refuse sinon une valeur obsolète (voir L1 du plan).
- Aucun secret dans le diff (`.env`, tokens, etc.). Ce dépôt est **public** : pas d'identifiant de compte
  d'hébergement ni de détail d'infrastructure dans la documentation.
- La documentation est à jour (README.md, ce fichier).

## 3. Relecture et fusion (règle L2)
GitHub refuse la protection de branche sur les dépôts privés gratuits. La règle est donc
écrite et doit être appliquée manuellement :
- **Aucune PR n'est fusionnée sans relecture humaine.** Relecteurs autorisés : Chris
  ou le propriétaire du dépôt.
- **L'auteur d'une PR ne fusionne jamais sa propre PR.** Claude et Gemini ne fusionnent
  jamais : Claude prépare la commande, **le propriétaire fusionne**.
- **Une fusion dans main déclenche un redéploiement automatique** : Vercel redéploie
  `nouankany-staging-frontend`. Vérifier que la PR est bien prête (tests locaux verts,
  documentation synchronisée) avant de demander la fusion. Si Vercel ne redéploie pas, voir
  `docs/SUIVI_TECHNIQUE.md` du dépôt backend (section « Pièges »).

## 4. Style de commit
Conventional Commits : feat, fix, docs, test, chore, data. Message en français,
une phrase courte qui dit le pourquoi.

## 5. Après la fusion
- Mets à jour `docs/JOURNAL_AVANCEMENT.md` (dans le dépôt backend) dans la même PR.
- Vérifie que le déploiement est bien passé sur Vercel (`vercel ls nouankany-staging-frontend`).
- En cas d'incident, reviens à la PR précédente plutôt que de patcher à chaud.

## 6. Pièges connus
- Node version : la CI utilise Node 22 (voir workflows/tests.yml).
- Vercel : l'URL du backend provient du fichier `.env.production` (`VITE_API_BASE_URL`), pas d'une variable du tableau de bord.
