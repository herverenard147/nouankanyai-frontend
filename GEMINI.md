# Instructions pour Gemini (dépôt frontend nouankanyai-frontend)

Le document de passation qui fait foi est dans le dépôt backend :
`../NouanKanyAI/docs/PASSATION_GEMINI.md` en local, ou
https://github.com/herverenard147/NouanKanyAI/blob/main/docs/PASSATION_GEMINI.md.
Lis-le en entier avant toute action, puis `CLAUDE.md`, `DESIGN.md` et `MISE_EN_LIGNE.md` de ce dépôt.

Rappels non négociables :

- avant et après chaque modification : `npx tsc -b && npx vitest run && npm run lint && npm run build` ;
  le nombre de tests qui passent ne baisse jamais ;
- une tâche = une branche = une PR ; jamais de commit direct sur `main` (Vercel redéploie `main`) ;
- les droits par profil se déclarent uniquement dans `src/lib/navConfig.ts` ; une fonction par route
  dans `src/api/rawBackend.ts` ;
- aucune donnée inventée : état vide (`MetricState`) ou provenance affichée (`ProvenanceBadge`) ;
- interface en français, sans tiret cadratin ; le niveau d'affichage change réellement chaque écran.
