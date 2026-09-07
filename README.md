# Veille / IA

Site éditorial statique alimenté par n8n, avec une quotidienne et **La semaine IA**.

## Fonctionnel

- la quotidienne la plus récente reste le hero « Aujourd’hui » ;
- mise en avant dédiée du dernier hebdo, sans évincer la quotidienne ;
- quotidiennes à 3 actualités, rétrospectives et hebdos premium (5 actualités, 3 enseignements, 2–3 points à surveiller) ;
- briefing audio facultatif ; l’audio hebdo affiche sa durée réelle de 6 ou 7 minutes ;
- archives, calendrier multi-éditions par date et pages permanentes ;
- rendu statique compatible Vercel, sans base de données.

## Commandes

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

Les éditions sont dans `content/editions/`. Les flux n8n frères — quotidien 08:00 et hebdo dimanche 18:00 — ainsi que leurs sorties canal/site indépendantes sont documentés dans `docs/n8n-publication.md`.
