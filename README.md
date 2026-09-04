# Veille / IA

Site éditorial statique alimenté par le workflow n8n **AI News - Digest lisible V2**.

## Fonctionnel

- édition la plus récente sur l’accueil ;
- trois actualités sourcées et hiérarchisées dans les nouvelles éditions ;
- briefing audio lorsqu’il est disponible ;
- archive complète remontant au début juillet 2026 ;
- calendrier mensuel distinguant éditions quotidiennes et rétrospectives ;
- pages permanentes pour chaque publication ;
- rendu statique compatible Vercel ;
- aucune base de données.

## Commandes

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Les éditions se trouvent dans `content/editions/`. Le branchement n8n est documenté dans `docs/n8n-publication.md` et la provenance des archives reconstruites dans `docs/archive-backfill-sources.md`.
