# Publication quotidienne et hebdomadaire sans base de données

Le site lit uniquement `content/editions/*.json`. Chaque fichier est une édition permanente et versionnée.

## Deux flux frères, indépendants

```text
Quotidien — 08:00
  → sélection de 3 actualités → n8n-build-site-edition.js → siteEdition → publisher GitHub

Hebdo — dimanche 18:00
  → 1 signal fort + 4 essentiels, 3 enseignements, 2–3 points à surveiller
  → n8n-build-weekly-edition.js → siteEdition → publisher GitHub
```

Les sorties vers Teams/Telegram et la publication site sont indépendantes. `skipTeams` ne bloque jamais le site ; seul `skipSitePublication: true` l’arrête explicitement.

## Contrats

- daily : slug `YYYY-MM-DD`, `kind: "daily"`, exactement 3 actualités ;
- weekly : slug `hebdo-YYYY-MM-DD`, `kind: "weekly"`, `publicationDate === periodEnd`, exactement 5 actualités, 3 objets `insights`, 2–3 chaînes `watchlist`, lecture 5 min ;
- l’audio weekly est facultatif. S’il existe, `audioMinutes` est obligatoirement `6` ou `7` ;
- toutes les URLs source et audio sont HTTPS.

Les deux builders préservent le payload entrant et ajoutent **le même** champ aval `siteEdition`. Le code est compatible avec le VM Code n8n sans supposer `URL` global.

## Publication GitHub

`automation/n8n-publish-site-edition-github.js` effectue un upsert idempotent de `content/editions/{siteEdition.slug}.json` sur `main`, puis le build Vercel est déclenché par l’intégration Git. Configurer `GITHUB_TOKEN_VEILLE_IA` comme secret/credential n8n à portée limitée ; aucun jeton ne doit être placé dans le workflow.
