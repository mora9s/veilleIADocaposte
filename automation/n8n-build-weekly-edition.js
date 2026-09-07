// n8n Code node — weekly sibling of n8n-build-site-edition.js.
// Preserves every upstream field and exposes the shared downstream siteEdition payload.
const input = $input.first().json;
const selected = Array.isArray(input.selectedItems) ? input.selectedItems : [];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (value) => {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};
const isIsoInstant = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/.test(value) &&
  isIsoDate(value.slice(0, 10)) &&
  !Number.isNaN(Date.parse(value));
const requireText = (value, field, minimum) => {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < minimum) throw new Error(`${field} absent ou trop court`);
  return text;
};
const requireHttps = (value, field) => {
  const url = typeof value === "string" ? value.trim() : "";
  if (
    !/^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i.test(
      url,
    )
  )
    throw new Error(`${field} doit être une URL HTTPS`);
  return url;
};
const generatedText = input.generatedAt || input.date;
if (!generatedText) throw new Error("generatedAt/date absent du digest n8n");
if (!isIsoInstant(generatedText))
  throw new Error("Date invalide dans le digest n8n");
const generated = new Date(generatedText);
const periodStart = input.periodStart;
const periodEnd = input.periodEnd;
if (!isIsoDate(periodStart) || !isIsoDate(periodEnd))
  throw new Error("periodStart/periodEnd invalides");
const periodEndDate = new Date(`${periodEnd}T00:00:00.000Z`);
if (periodEndDate.getUTCDay() !== 0)
  throw new Error("periodEnd doit être un dimanche");
const expectedStart = new Date(periodEndDate.getTime() - 6 * 86400000)
  .toISOString()
  .slice(0, 10);
if (periodStart !== expectedStart)
  throw new Error("La période hebdomadaire doit couvrir exactement sept jours");
if (selected.length !== 5)
  throw new Error(
    `Le site exige exactement 5 actualités (reçu : ${selected.length})`,
  );
if (!Array.isArray(input.insights) || input.insights.length !== 3)
  throw new Error("Le site exige exactement 3 enseignements");
if (
  !Array.isArray(input.watchlist) ||
  input.watchlist.length < 2 ||
  input.watchlist.length > 3
)
  throw new Error("Le site exige 2 à 3 points à surveiller");
const date = new Date(`${periodEnd}T12:00:00Z`);
const dateLabel = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(date);
const weekdayRaw = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  weekday: "long",
}).format(date);
const weekday = weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1);
const epoch = Date.UTC(2026, 8, 6);
const endDay = Date.UTC(
  Number(periodEnd.slice(0, 4)),
  Number(periodEnd.slice(5, 7)) - 1,
  Number(periodEnd.slice(8, 10)),
);
if ((endDay - epoch) % 604800000 !== 0 || endDay < epoch)
  throw new Error(
    "periodEnd ne correspond pas à une édition hebdomadaire déterministe",
  );
const storyUrls = new Set();
const stories = selected.map((item, index) => {
  const title = requireText(
    item.headline_fr || item.title,
    "Actualité invalide : titre",
    10,
  );
  const originalTitle = requireText(
    item.title,
    "Actualité invalide : titre original",
    10,
  );
  const publishedText = requireText(
    item.publishedAt,
    "Actualité invalide : date de publication",
    10,
  );
  const published = new Date(publishedText);
  if (!isIsoInstant(publishedText))
    throw new Error("Actualité invalide : date de publication");
  const publishedAt = published.toISOString();
  const publishedDay = publishedAt.slice(0, 10);
  if (publishedDay < periodStart || publishedDay > periodEnd)
    throw new Error("Actualité invalide : date hors période hebdomadaire");
  const url = requireHttps(
    item.canonicalUrl || item.url,
    "Actualité invalide : url",
  );
  if (storyUrls.has(url)) throw new Error("Actualité invalide : URL dupliquée");
  storyUrls.add(url);
  return {
    rank: index + 1,
    title,
    originalTitle,
    summary: requireText(
      item.summary_fr || item.summary,
      "Actualité invalide : résumé",
      50,
    ),
    source: requireText(item.source, "Actualité invalide : source", 2),
    category: requireText(item.category, "Actualité invalide : catégorie", 3),
    url,
    publishedAt,
    accent: ["blue", "violet", "orange"][index % 3],
  };
});
const insights = input.insights.map((item, index) => ({
  title: requireText(item?.title, `Enseignement ${index + 1}`, 3),
  body: requireText(item?.body, `Enseignement ${index + 1}`, 10),
}));
const watchlist = input.watchlist.map((item, index) =>
  requireText(item, `Point à surveiller ${index + 1}`, 3),
);
const rawAudio = input.tts?.publicUrl || input.audioUrl || null;
const audioUrl = rawAudio ? requireHttps(rawAudio, "audioUrl") : null;
const audioMinutes = audioUrl ? input.audioMinutes : null;
if (audioUrl && audioMinutes !== 6 && audioMinutes !== 7)
  throw new Error("audioMinutes doit être 6 ou 7 pour un audio hebdomadaire");
return [
  {
    json: {
      ...input,
      siteEdition: {
        slug: `hebdo-${periodEnd}`,
        kind: "weekly",
        publicationDate: periodEnd,
        periodStart,
        periodEnd,
        dateLabel,
        weekday,
        editionNumber: Math.floor((endDay - epoch) / 604800000) + 1,
        readingMinutes: 5,
        dek: stories[0].title,
        stories,
        insights,
        watchlist,
        audioUrl,
        audioMinutes,
        generatedAt: generated.toISOString(),
      },
    },
  },
];
