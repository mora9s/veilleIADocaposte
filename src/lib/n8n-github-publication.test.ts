import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const AsyncFunction = Object.getPrototypeOf(async function () {})
  .constructor as new (
  ...args: string[]
) => (...args: unknown[]) => Promise<Array<{ json: Record<string, unknown> }>>;
const source = fs.readFileSync(
  path.join(process.cwd(), "automation", "n8n-publish-site-edition-github.js"),
  "utf8",
);
const edition = {
  slug: "2026-09-04",
  kind: "daily",
  dateLabel: "4 septembre 2026",
  weekday: "Vendredi",
  editionNumber: 126,
  readingMinutes: 4,
  dek: "Le titre principal",
  stories: Array.from({ length: 3 }, (_, index) => ({
    rank: index + 1,
    title: `Titre détaillé de l’actualité numéro ${index + 1}`,
    originalTitle: `Original weekly news title number ${index + 1}`,
    summary: `Résumé éditorial suffisamment détaillé pour décrire correctement l’actualité numéro ${index + 1} sans ambiguïté.`,
    source: `Source ${index + 1}`,
    category: "Actualité IA",
    url: `https://example.org/${index + 1}`,
    publishedAt: "2026-09-04T05:00:00.000Z",
    accent: ["blue", "violet", "orange"][index],
  })),
  audioUrl: null,
  generatedAt: "2026-09-04T06:00:00.000Z",
};

function execute(
  httpRequest: ReturnType<typeof vi.fn>,
  token = "test-token",
  editionInput: Record<string, unknown> = edition,
) {
  const run = new AsyncFunction("$input", "$env", source);
  return run.call(
    { helpers: { httpRequest } },
    {
      first: () => ({
        json: { siteEdition: editionInput, teamsMarkdown: "préservé" },
      }),
    },
    { GITHUB_TOKEN_VEILLE_IA: token },
  );
}

describe("n8n GitHub site publisher", () => {
  it("creates the dated edition and preserves the digest payload", async () => {
    const httpRequest = vi
      .fn()
      .mockRejectedValueOnce({ statusCode: 404 })
      .mockResolvedValueOnce({
        commit: { sha: "abc123" },
        content: { html_url: "https://github.com/file" },
      });

    const result = await execute(httpRequest);

    expect(result[0].json.teamsMarkdown).toBe("préservé");
    expect(result[0].json.sitePublication).toMatchObject({
      status: "created",
      path: "content/editions/2026-09-04.json",
      commitSha: "abc123",
    });
    expect(httpRequest).toHaveBeenCalledTimes(2);
    expect(httpRequest.mock.calls[1][0]).toMatchObject({
      method: "PUT",
      body: { branch: "main" },
    });
  });

  it("does not create a commit when the edition is unchanged", async () => {
    const text = `${JSON.stringify(edition, null, 2)}\n`;
    const httpRequest = vi.fn().mockResolvedValueOnce({
      sha: "file-sha",
      content: Buffer.from(text).toString("base64"),
    });

    const result = await execute(httpRequest);

    expect(result[0].json.sitePublication).toMatchObject({
      status: "unchanged",
      commitSha: null,
    });
    expect(httpRequest).toHaveBeenCalledTimes(1);
  });

  it("publishes weekly editions even when Teams delivery was skipped", async () => {
    const weekly = {
      ...edition,
      slug: "hebdo-2026-09-06",
      kind: "weekly",
      publicationDate: "2026-09-06",
      periodStart: "2026-08-31",
      periodEnd: "2026-09-06",
      readingMinutes: 5,
      stories: Array.from({ length: 5 }, (_, index) => ({
        ...edition.stories[index % 3],
        rank: index + 1,
        url: `https://example.org/weekly-${index + 1}`,
        publishedAt: "2026-09-04T05:00:00.000Z",
      })),
      insights: Array.from({ length: 3 }, (_, index) => ({
        title: `Insight ${index + 1}`,
        body: `Analyse prudente ${index + 1}`,
      })),
      watchlist: [
        "À surveiller : premier point",
        "À surveiller : deuxième point",
      ],
    };
    const httpRequest = vi
      .fn()
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ commit: { sha: "weekly-sha" }, content: {} });
    const run = new AsyncFunction("$input", "$env", source);
    const result = await run.call(
      { helpers: { httpRequest } },
      { first: () => ({ json: { siteEdition: weekly, skipTeams: true } }) },
      { GITHUB_TOKEN_VEILLE_IA: "test-token" },
    );
    expect(result[0].json.sitePublication).toMatchObject({
      status: "created",
      path: "content/editions/hebdo-2026-09-06.json",
    });
    expect(httpRequest).toHaveBeenCalledTimes(2);
  });

  it("rejects a weekly slug that does not exactly match its publication date", async () => {
    const httpRequest = vi.fn();
    const malformed = {
      ...edition,
      kind: "weekly",
      slug: "hebdo-2026-09-05",
      publicationDate: "2026-09-06",
      periodStart: "2026-08-31",
      periodEnd: "2026-09-06",
      readingMinutes: 5,
      stories: Array.from({ length: 5 }, (_, index) => ({
        ...edition.stories[index % 3],
        rank: index + 1,
        url: `https://example.org/weekly-${index + 1}`,
        publishedAt: "2026-09-04T05:00:00.000Z",
      })),
      insights: Array.from({ length: 3 }, (_, index) => ({
        title: `Insight ${index}`,
        body: "Analyse prudente",
      })),
      watchlist: ["À surveiller : un", "À surveiller : deux"],
    };
    const run = new AsyncFunction("$input", "$env", source);
    await expect(
      run.call(
        { helpers: { httpRequest } },
        { first: () => ({ json: { siteEdition: malformed } }) },
        { GITHUB_TOKEN_VEILLE_IA: "test-token" },
      ),
    ).rejects.toThrow(/invalide/);
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it("rejects malformed metadata and deep weekly contract violations before GitHub", async () => {
    const httpRequest = vi.fn();
    await expect(
      execute(httpRequest, "test-token", {
        ...edition,
        stories: edition.stories.map((story, index) => ({
          ...story,
          rank: index === 1 ? 1 : story.rank,
        })),
      }),
    ).rejects.toThrow(/invalide/);
    await expect(
      execute(httpRequest, "test-token", {
        ...edition,
        stories: edition.stories.map((story, index) =>
          index === 0 ? { ...story, originalTitle: "" } : story,
        ),
      }),
    ).rejects.toThrow(/invalide/);
    await expect(
      execute(httpRequest, "test-token", {
        ...edition,
        slug: "hebdo-2026-09-06",
        kind: "weekly",
        publicationDate: "2026-09-06",
        periodStart: "2026-09-01",
        periodEnd: "2026-09-06",
        readingMinutes: 5,
        stories: Array.from({ length: 5 }, (_, index) => ({
          ...edition.stories[index % 3],
          rank: index + 1,
          url: `https://example.org/strict-weekly-${index + 1}`,
        })),
        insights: Array.from({ length: 3 }, (_, index) => ({
          title: `Insight ${index + 1}`,
          body: `Analyse prudente et suffisamment détaillée ${index + 1}`,
        })),
        watchlist: ["Premier point à suivre", "Deuxième point à suivre"],
      }),
    ).rejects.toThrow(/invalide/);
    expect(httpRequest).not.toHaveBeenCalled();
  });

  it("only skips site publication when explicitly requested", async () => {
    const httpRequest = vi.fn();
    const run = new AsyncFunction("$input", "$env", source);
    const result = await run.call(
      { helpers: { httpRequest } },
      {
        first: () => ({
          json: { siteEdition: edition, skipSitePublication: true },
        }),
      },
      { GITHUB_TOKEN_VEILLE_IA: "test-token" },
    );
    expect(result[0].json.sitePublication).toMatchObject({ status: "skipped" });
    expect(httpRequest).not.toHaveBeenCalled();
  });
});
