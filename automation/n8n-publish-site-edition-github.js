// n8n Code node — shared daily/weekly GitHub publisher.
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const HTTPS =
  /^https:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?::\d{1,5})?(?:[/?#][^\s]*)?$/i;
const validText = (value, minimum) =>
  typeof value === "string" && value.trim().length >= minimum;
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
const isHttps = (value) => typeof value === "string" && HTTPS.test(value);
const validStories = (stories, expectedLength) => {
  if (!Array.isArray(stories) || stories.length !== expectedLength)
    return false;
  const urls = new Set();
  return stories.every((story, index) => {
    if (!story || typeof story !== "object") return false;
    if (story.url) urls.add(story.url);
    return (
      story.rank === index + 1 &&
      validText(story.title, 10) &&
      validText(story.originalTitle, 3) &&
      validText(story.summary, 50) &&
      validText(story.source, 2) &&
      validText(story.category, 3) &&
      isHttps(story.url) &&
      (isIsoDate(story.publishedAt) || isIsoInstant(story.publishedAt)) &&
      (story.accent === "blue" ||
        story.accent === "violet" ||
        story.accent === "orange") &&
      urls.size === index + 1
    );
  });
};
const isSevenDayWeek = (start, end) => {
  if (!isIsoDate(start) || !isIsoDate(end)) return false;
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const expectedStart = new Date(endDate.getTime() - 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  return endDate.getUTCDay() === 0 && start === expectedStart;
};
const validCommon = (edition, storyCount) =>
  edition &&
  typeof edition === "object" &&
  validText(edition.slug, 10) &&
  validText(edition.dateLabel, 3) &&
  validText(edition.weekday, 3) &&
  Number.isInteger(edition.editionNumber) &&
  edition.editionNumber > 0 &&
  Number.isInteger(edition.readingMinutes) &&
  edition.readingMinutes > 0 &&
  validText(edition.dek, 10) &&
  isIsoInstant(edition.generatedAt) &&
  (edition.audioUrl === null || isHttps(edition.audioUrl)) &&
  validStories(edition.stories, storyCount);
const validPublicationEdition = (edition) => {
  if (edition?.kind === "daily")
    return validCommon(edition, 3) && isIsoDate(edition.slug);
  if (edition?.kind !== "weekly" || !validCommon(edition, 5)) return false;
  return (
    isIsoDate(edition.publicationDate) &&
    edition.slug === `hebdo-${edition.publicationDate}` &&
    edition.publicationDate === edition.periodEnd &&
    isSevenDayWeek(edition.periodStart, edition.periodEnd) &&
    edition.readingMinutes === 5 &&
    edition.stories.every((story) => {
      const published = story.publishedAt.slice(0, 10);
      return published >= edition.periodStart && published <= edition.periodEnd;
    }) &&
    Array.isArray(edition.insights) &&
    edition.insights.length === 3 &&
    edition.insights.every(
      (insight) =>
        insight && validText(insight.title, 3) && validText(insight.body, 10),
    ) &&
    Array.isArray(edition.watchlist) &&
    edition.watchlist.length >= 2 &&
    edition.watchlist.length <= 3 &&
    edition.watchlist.every((item) => validText(item, 3)) &&
    (edition.audioUrl === null
      ? edition.audioMinutes === null || edition.audioMinutes === undefined
      : edition.audioMinutes === 6 || edition.audioMinutes === 7)
  );
};
async function publishEdition() {
  const input = $input.first().json;
  if (input.skipSitePublication === true)
    return [
      {
        json: {
          ...input,
          sitePublication: { status: "skipped", path: null, commitSha: null },
        },
      },
    ];
  const edition = input.siteEdition;
  const token = $env.GITHUB_TOKEN_VEILLE_IA;
  const owner = "mora9s";
  const repository = "veilleIADocaposte";
  const branch = "main";
  if (!token) throw new Error("GITHUB_TOKEN_VEILLE_IA absent");
  if (!validPublicationEdition(edition))
    throw new Error("siteEdition daily ou weekly invalide");
  const filePath = `content/editions/${edition.slug}.json`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repository}/contents/${filePath}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "n8n-veille-ia-publisher",
  };
  const fileText = `${JSON.stringify(edition, null, 2)}\n`;
  let existing = null;
  try {
    existing = await this.helpers.httpRequest({
      method: "GET",
      url: apiUrl,
      headers,
      qs: { ref: branch },
      json: true,
    });
  } catch (error) {
    const status =
      error?.statusCode ||
      error?.status ||
      error?.response?.statusCode ||
      error?.response?.status;
    if (status !== 404) throw error;
  }
  if (existing?.content) {
    const current = Buffer.from(
      String(existing.content).replace(/\s/g, ""),
      "base64",
    ).toString("utf8");
    if (current === fileText)
      return [
        {
          json: {
            ...input,
            sitePublication: {
              status: "unchanged",
              path: filePath,
              commitSha: null,
            },
          },
        },
      ];
  }
  const body = {
    message: `${existing?.sha ? "chore" : "feat"}: publish AI ${edition.kind} edition ${edition.slug}`,
    content: Buffer.from(fileText, "utf8").toString("base64"),
    branch,
    ...(existing?.sha ? { sha: existing.sha } : {}),
  };
  const result = await this.helpers.httpRequest({
    method: "PUT",
    url: apiUrl,
    headers,
    body,
    json: true,
  });
  const commitSha = result?.commit?.sha;
  if (!commitSha) throw new Error("GitHub n’a retourné aucun SHA de commit");
  return [
    {
      json: {
        ...input,
        sitePublication: {
          status: existing?.sha ? "updated" : "created",
          path: filePath,
          commitSha,
          htmlUrl: result?.content?.html_url || null,
        },
      },
    },
  ];
}
return publishEdition.call(this);
