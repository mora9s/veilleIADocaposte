// n8n Code node — place after “12d - Injecter URL audio dans card Teams”.
// It adds a deployment-ready static edition while preserving the existing digest payload.
const input = $input.first().json;
const selected = Array.isArray(input.selectedItems) ? input.selectedItems : [];

if (!input.generatedAt && !input.date) {
  throw new Error('generatedAt/date absent du digest n8n');
}
if (selected.length !== 3) {
  throw new Error(`Le site exige exactement 3 actualités (reçu : ${selected.length})`);
}

const dateSource = input.generatedAt || input.date;
const generated = new Date(dateSource);
if (Number.isNaN(generated.getTime())) {
  throw new Error('Date invalide dans le digest n8n');
}
const parisDate = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(generated);
const slug = parisDate;
const dateLabel = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris', day: 'numeric', month: 'long', year: 'numeric'
}).format(generated);
const weekdayRaw = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris', weekday: 'long'
}).format(generated);
const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
const editionEpoch = Date.UTC(2026, 4, 2);
const currentDay = Date.UTC(Number(slug.slice(0, 4)), Number(slug.slice(5, 7)) - 1, Number(slug.slice(8, 10)));
const editionNumber = Math.floor((currentDay - editionEpoch) / 86400000) + 1;
const accents = ['blue', 'violet', 'orange'];

const requireText = (value, field, minimum) => {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < minimum) throw new Error(`Actualité invalide : ${field} absent ou trop court`);
  return text;
};
const requireHttpsUrl = (value, field) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') throw new Error('protocol');
    return url.toString();
  } catch {
    throw new Error(`Actualité invalide : ${field} doit être une URL HTTPS`);
  }
};

const stories = selected.slice(0, 3).map((item, index) => {
  const title = requireText(item.headline_fr || item.title, 'titre', 10);
  const summary = requireText(item.summary_fr || item.summary, 'résumé', 50);
  const source = requireText(item.source, 'source', 2);
  const url = requireHttpsUrl(item.canonicalUrl || item.url, 'url');
  const published = new Date(item.publishedAt || generated);
  return {
    rank: index + 1,
    title,
    originalTitle: requireText(item.title || title, 'titre original', 10),
    summary,
    source,
    category: requireText(item.category || 'Actualité IA', 'catégorie', 3),
    url,
    publishedAt: Number.isNaN(published.getTime()) ? generated.toISOString() : published.toISOString(),
    accent: accents[index % accents.length],
  };
});

const rawAudioUrl = input.tts?.publicUrl || input.audioUrl || null;
const audioUrl = rawAudioUrl ? requireHttpsUrl(rawAudioUrl, 'audioUrl') : null;

return [{ json: {
  ...input,
  siteEdition: {
    slug,
    dateLabel,
    weekday,
    editionNumber,
    readingMinutes: Math.max(2, stories.length + 1),
    dek: stories[0].title,
    stories,
    audioUrl,
    generatedAt: generated.toISOString(),
  },
}}];
