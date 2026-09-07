import fs from "node:fs";
import path from "node:path";

export type StoryAccent = "blue" | "violet" | "orange";
export type EditionKind = "daily" | "retrospective" | "weekly";

export type Story = {
  rank: number;
  title: string;
  originalTitle: string;
  summary: string;
  source: string;
  category: string;
  url: string;
  publishedAt: string;
  accent: StoryAccent;
};
export type Insight = { title: string; body: string };
export type Edition = {
  slug: string;
  kind: EditionKind;
  publicationDate?: string;
  periodStart?: string;
  periodEnd?: string;
  dateLabel: string;
  weekday: string;
  editionNumber: number;
  readingMinutes: number;
  dek: string;
  stories: Story[];
  insights?: Insight[];
  watchlist?: string[];
  audioMinutes?: 6 | 7 | null;
  audioUrl: string | null;
  generatedAt: string;
};
const editionsDirectory = path.join(process.cwd(), "content", "editions");
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
export function getPublicationDate(
  edition: Pick<Edition, "slug" | "publicationDate">,
): string {
  if (edition.publicationDate && DATE.test(edition.publicationDate))
    return edition.publicationDate;
  const legacy = edition.slug.match(/^(?:hebdo-)?(\d{4}-\d{2}-\d{2})$/)?.[1];
  if (!legacy)
    throw new Error(`Date de publication introuvable: ${edition.slug}`);
  return legacy;
}
function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
function isIsoInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) &&
    isIsoDate(value.slice(0, 10)) &&
    !Number.isNaN(Date.parse(value))
  );
}
function validText(value: unknown, minimum: number): value is string {
  return typeof value === "string" && value.trim().length >= minimum;
}
function validStories(stories: unknown): stories is Story[] {
  if (!Array.isArray(stories) || !stories.length) return false;
  const urls = new Set<string>();
  return stories.every((story, index) => {
    if (!story || typeof story !== "object") return false;
    const candidate = story as Partial<Story>;
    if (candidate.url) urls.add(candidate.url);
    return (
      candidate.rank === index + 1 &&
      validText(candidate.title, 10) &&
      validText(candidate.originalTitle, 3) &&
      validText(candidate.summary, 50) &&
      validText(candidate.source, 2) &&
      validText(candidate.category, 3) &&
      isHttpsUrl(candidate.url) &&
      (isIsoDate(candidate.publishedAt) ||
        isIsoInstant(candidate.publishedAt)) &&
      (candidate.accent === "blue" ||
        candidate.accent === "violet" ||
        candidate.accent === "orange") &&
      urls.size === index + 1
    );
  });
}
function storiesInsidePeriod(stories: Story[], start: string, end: string) {
  return stories.every((story) => {
    const date = story.publishedAt.slice(0, 10);
    return date >= start && date <= end;
  });
}
function isSevenDayWeek(start: string, end: string) {
  if (!isIsoDate(start) || !isIsoDate(end)) return false;
  const endDate = new Date(`${end}T00:00:00.000Z`);
  const expectedStart = new Date(endDate.getTime() - 6 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return endDate.getUTCDay() === 0 && start === expectedStart;
}
export function validateEdition(value: unknown): value is Edition {
  if (!value || typeof value !== "object") return false;
  const edition = value as Partial<Edition>;
  const kind = edition.kind;
  if (kind !== "daily" && kind !== "retrospective" && kind !== "weekly")
    return false;
  const publicationDate =
    typeof edition.publicationDate === "string"
      ? edition.publicationDate
      : edition.slug?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0];
  const shared = Boolean(
    validText(edition.slug, 10) &&
      validText(edition.dateLabel, 3) &&
      validText(edition.weekday, 3) &&
      Number.isInteger(edition.editionNumber) &&
      edition.editionNumber! > 0 &&
      Number.isInteger(edition.readingMinutes) &&
      edition.readingMinutes! > 0 &&
      validText(edition.dek, 10) &&
      isIsoInstant(edition.generatedAt) &&
      publicationDate &&
      isIsoDate(publicationDate) &&
      (edition.audioUrl === null || isHttpsUrl(edition.audioUrl)) &&
      validStories(edition.stories),
  );
  if (!shared) return false;
  const stories = edition.stories!;
  if (kind === "weekly")
    return Boolean(
      edition.slug === `hebdo-${edition.publicationDate}` &&
        edition.publicationDate === edition.periodEnd &&
        isSevenDayWeek(edition.periodStart!, edition.periodEnd!) &&
        edition.readingMinutes === 5 &&
        stories.length === 5 &&
        storiesInsidePeriod(
          stories,
          edition.periodStart!,
          edition.periodEnd!,
        ) &&
        Array.isArray(edition.insights) &&
        edition.insights.length === 3 &&
        edition.insights.every(
          (insight) =>
            insight &&
            validText(insight.title, 3) &&
            validText(insight.body, 10),
        ) &&
        Array.isArray(edition.watchlist) &&
        edition.watchlist.length >= 2 &&
        edition.watchlist.length <= 3 &&
        edition.watchlist.every((item) => validText(item, 3)) &&
        (edition.audioUrl === null
          ? edition.audioMinutes === null || edition.audioMinutes === undefined
          : edition.audioMinutes === 6 || edition.audioMinutes === 7),
    );
  if (
    !isIsoDate(edition.slug) ||
    (edition.publicationDate !== undefined &&
      edition.publicationDate !== edition.slug)
  )
    return false;
  if (kind === "retrospective")
    return Boolean(
      isIsoDate(edition.periodStart) &&
        isIsoDate(edition.periodEnd) &&
        edition.periodStart <= edition.periodEnd &&
        stories.length >= 2 &&
        stories.length <= 3 &&
        storiesInsidePeriod(stories, edition.periodStart, edition.periodEnd),
    );
  return stories.length >= 2 && stories.length <= 3;
}
const kindOrder: Record<EditionKind, number> = {
  daily: 0,
  weekly: 1,
  retrospective: 2,
};
function compareEditions(a: Edition, b: Edition) {
  const date = getPublicationDate(b).localeCompare(getPublicationDate(a));
  return (
    date ||
    kindOrder[a.kind] - kindOrder[b.kind] ||
    a.slug.localeCompare(b.slug)
  );
}
export function getAllEditions(): Edition[] {
  if (!fs.existsSync(editionsDirectory)) return [];
  return fs
    .readdirSync(editionsDirectory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const parsed: unknown = JSON.parse(
        fs.readFileSync(path.join(editionsDirectory, name), "utf8"),
      );
      if (!validateEdition(parsed))
        throw new Error(`Édition invalide: ${name}`);
      return parsed;
    })
    .sort(compareEditions);
}
export function getEditionBySlug(slug: string) {
  return getAllEditions().find((edition) => edition.slug === slug);
}
export function getLatestEdition(): Edition {
  const edition =
    getAllEditions().find((candidate) => candidate.kind === "daily") ??
    getAllEditions()[0];
  if (!edition) throw new Error("Aucune édition publiée");
  return edition;
}
export function getLatestWeeklyEdition() {
  return getAllEditions().find((edition) => edition.kind === "weekly");
}
export function getAdjacentEditions(slug: string) {
  const editions = getAllEditions();
  const index = editions.findIndex((edition) => edition.slug === slug);
  return index < 0
    ? { newer: undefined, older: undefined }
    : { newer: editions[index - 1], older: editions[index + 1] };
}
