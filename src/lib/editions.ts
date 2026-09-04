import fs from "node:fs";
import path from "node:path";

export type StoryAccent = "blue" | "violet" | "orange";

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

export type Edition = {
  slug: string;
  kind: "daily" | "retrospective";
  periodStart?: string;
  periodEnd?: string;
  dateLabel: string;
  weekday: string;
  editionNumber: number;
  readingMinutes: number;
  dek: string;
  stories: Story[];
  audioUrl: string | null;
  generatedAt: string;
};

const editionsDirectory = path.join(process.cwd(), "content", "editions");

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isEdition(value: unknown): value is Edition {
  if (!value || typeof value !== "object") return false;
  const edition = value as Partial<Edition>;
  return Boolean(
    edition.slug &&
      /^\d{4}-\d{2}-\d{2}$/.test(edition.slug) &&
      edition.dateLabel &&
      edition.weekday &&
      edition.generatedAt &&
      !Number.isNaN(Date.parse(edition.generatedAt)) &&
      (edition.kind === "daily" || edition.kind === "retrospective") &&
      (edition.kind !== "retrospective" ||
        (typeof edition.periodStart === "string" && /^\d{4}-\d{2}-\d{2}$/.test(edition.periodStart) &&
          typeof edition.periodEnd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(edition.periodEnd))) &&
      (edition.audioUrl === null || isHttpsUrl(edition.audioUrl)) &&
      Array.isArray(edition.stories) &&
      edition.stories.length >= 2 &&
      edition.stories.length <= 3 &&
      edition.stories.every(
        (story) =>
          story &&
          typeof story.title === "string" &&
          story.title.trim().length >= 10 &&
          typeof story.summary === "string" &&
          story.summary.trim().length >= 50 &&
          typeof story.source === "string" &&
          story.source.trim().length >= 2 &&
          isHttpsUrl(story.url),
      ),
  );
}

export function getAllEditions(): Edition[] {
  if (!fs.existsSync(editionsDirectory)) return [];

  return fs
    .readdirSync(editionsDirectory)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => {
      const filePath = path.join(editionsDirectory, fileName);
      const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!isEdition(parsed)) {
        throw new Error(`Édition invalide: ${fileName}`);
      }
      return parsed;
    })
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

export function getEditionBySlug(slug: string): Edition | undefined {
  return getAllEditions().find((edition) => edition.slug === slug);
}

export function getLatestEdition(): Edition {
  const edition = getAllEditions()[0];
  if (!edition) throw new Error("Aucune édition publiée");
  return edition;
}

export function getAdjacentEditions(slug: string) {
  const editions = getAllEditions();
  const index = editions.findIndex((edition) => edition.slug === slug);
  if (index < 0) return { newer: undefined, older: undefined };
  return {
    newer: editions[index - 1],
    older: editions[index + 1],
  };
}
