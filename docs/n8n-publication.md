# Publication quotidienne sans base de données

## Flux retenu

```text
n8n 08:00
  → sélection et réécriture des trois actualités
  → construction de `siteEdition`
  → commit d’un fichier JSON dans GitHub
  → nouveau build Vercel automatique
  → page d’accueil et archives mises à jour
```

Le site lit uniquement `content/editions/*.json`. Chaque fichier représente une édition permanente et versionnée.

## Branchement n8n préparé

Le code prêt à coller dans un nœud **Code** se trouve dans :

```text
automation/n8n-build-site-edition.js
```

Ce nœud doit être placé après `12d - Injecter URL audio dans card Teams`, car ce point contient à la fois `selectedItems` avec les résumés complets et l’URL audio finale. Il ajoute `siteEdition` sans modifier les champs Teams, Telegram ou audio existants.

## Publication GitHub

La dernière étape utilisera un nœud **GitHub** ou **HTTP Request** pour créer :

```text
content/editions/{siteEdition.slug}.json
```

Le contenu du fichier est `JSON.stringify(siteEdition, null, 2)`. Le commit quotidien déclenche ensuite le déploiement Vercel.

La connexion GitHub et l’activation du nœud seront faites seulement après validation du nom définitif du dépôt et du déploiement. Aucun jeton ne doit être stocké dans le workflow en clair : utiliser une credential n8n dédiée avec droit d’écriture limité à ce dépôt.

## Garanties

- pas de BDD ;
- une URL permanente par date ;
- historique et retour arrière via Git ;
- validation du build avant publication Vercel ;
- les scores internes n’apparaissent jamais sur le site ;
- les liens pointent toujours vers les sources originales.
