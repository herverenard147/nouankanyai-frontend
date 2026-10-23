# Instructions pour Gemini (dépôt frontend Nouankany)

Le document de passation qui fait foi est dans le dépôt backend :
`../NouanKanyAI/docs/PASSATION_GEMINI.md` en local, ou
https://github.com/herverenard147/NouanKanyAI/blob/main/docs/PASSATION_GEMINI.md (dépôt privé).
Lis-le en entier avant toute action, puis `docs/SUIVI_TECHNIQUE.md` du même dépôt (**état vérifié, points ouverts,
pièges : c'est là qu'on sait ce qui reste à faire**), puis `CLAUDE.md`, `DESIGN.md` et `MISE_EN_LIGNE.md` de ce dépôt.
Le plan A à Q de la passation est terminé, sauf les parties C et O : ne reprends pas une partie « faite ».

Rappels non négociables :

- tu ne fusionnes jamais une PR toi-même : relecture par Chris ou le propriétaire, et c'est le propriétaire qui fusionne ;
- quand un test échoue, corrige le code, pas le test ; écris les tests depuis le comportement attendu, erreurs et cas limites compris ;
- les clés et identifiants de déploiement viennent de Chris ou du propriétaire (partie J), jamais du dépôt ;
- avant et après chaque modification : `npx tsc -b && npx vitest run && npm run lint && npm run build` ;
  le nombre de tests qui passent ne baisse jamais ;
- une tâche = une branche = une PR ; jamais de commit direct sur `main` (Vercel redéploie `main`) ;
- les droits par profil se déclarent uniquement dans `src/lib/navConfig.ts` ; une fonction par route
  dans `src/api/rawBackend.ts` ;
- aucune donnée inventée : état vide (`MetricState`) ou provenance affichée (`ProvenanceBadge`) ;
- interface en français, sans tiret long ; le nom du produit est « Nouankany » ; le niveau d'affichage change réellement chaque écran ;
- ce dépôt est public : aucun identifiant de compte d'hébergement ni détail d'infrastructure dans les documents.
