# Contribuer à NouanKany (frontend)

Ce document fixe les règles non négociables du projet. En cas de doute, lire
d'abord PASSATION_GEMINI.md dans docs/ du dépôt backend.

## 1. Avant d'écrire du code
- Lance les tests et note le nombre exact de tests qui passent. Référence actuelle :
  112 passés + 13 sautés.
- Crée une branche dédiée au format feat/..., fix/..., docs/..., data/...
- Ne travaille jamais directement sur main.

## 2. Avant d'ouvrir une PR
- Tous les tests passent (au moins le même nombre qu'à la référence : 112 passés).
- Les nouveaux comportements ont leurs propres tests.
- Toute PR qui augmente le nombre de tests passés doit mettre à jour la valeur
  correspondante dans `.github/test-baseline.json`, dans la même PR. Le garde-fou
  CI refuse sinon une valeur obsolète (voir L1 du plan).
- Aucun secret dans le diff (`.env`, tokens, etc.).
- La CI GitHub Actions est verte.
- La documentation est à jour (README.md, ce fichier).

## 3. Relecture obligatoire avant fusion (règle L2)
GitHub refuse la protection de branche sur les dépôts privés gratuits. La règle est donc
écrite et doit être appliquée manuellement :
- **Aucune PR n'est fusionnée sans relecture humaine.** Relecteurs autorisés : Chris
  ou le propriétaire du dépôt.
- **L'auteur d'une PR ne fusionne jamais sa propre PR.**
- **Une fusion dans main déclenche un redéploiement automatique** :
  - Frontend : Vercel redéploie nouankany-staging-frontend.
  Vérifier que la PR est bien prête (CI verte, tests à jour, documentation synchronisée)
  avant de demander la fusion.
- Toute fusion demande l'accord explicite du propriétaire ou de Chris.

## 4. Style de commit
Conventional Commits : feat, fix, docs, test, chore, data. Message en français,
une phrase courte qui dit le pourquoi.

## 5. Après la fusion
- Mets à jour docs/JOURNAL_AVANCEMENT.md (dans le dépôt backend) dans la même PR.
- Vérifie que le déploiement staging est bien passé sur Vercel.
- En cas d'incident, reviens à la PR précédente plutôt que de patcher à chaud.

## 6. Pièges connus
- Node version : la CI utilise Node 22 (voir workflows/tests.yml).
- Vercel : l'URL du backend provient du fichier `.env.production` (`VITE_API_BASE_URL`), pas d'une variable du tableau de bord.
