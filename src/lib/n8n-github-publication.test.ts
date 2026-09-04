import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<Array<{ json: Record<string, unknown> }>>;
const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-publish-site-edition-github.js"), "utf8");
const edition = {
  slug: "2026-09-04",
  dateLabel: "4 septembre 2026",
  weekday: "Vendredi",
  editionNumber: 126,
  readingMinutes: 4,
  dek: "Le titre principal",
  stories: Array.from({ length: 3 }, (_, index) => ({
    rank: index + 1,
    title: `Titre ${index + 1}`,
    originalTitle: `Original ${index + 1}`,
    summary: `Résumé ${index + 1}`,
    source: `Source ${index + 1}`,
    category: "IA",
    url: `https://example.org/${index + 1}`,
    publishedAt: "2026-09-04T05:00:00.000Z",
    accent: ["blue", "violet", "orange"][index],
  })),
  audioUrl: null,
  generatedAt: "2026-09-04T06:00:00.000Z",
};

function execute(httpRequest: ReturnType<typeof vi.fn>, token = "test-token") {
  const run = new AsyncFunction("$input", "$env", source);
  return run.call(
    { helpers: { httpRequest } },
    { first: () => ({ json: { siteEdition: edition, teamsMarkdown: "préservé" } }) },
    { GITHUB_TOKEN_VEILLE_IA: token },
  );
}

describe("n8n GitHub site publisher", () => {
  it("creates the dated edition and preserves the digest payload", async () => {
    const httpRequest = vi.fn()
      .mockRejectedValueOnce({ statusCode: 404 })
      .mockResolvedValueOnce({ commit: { sha: "abc123" }, content: { html_url: "https://github.com/file" } });

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

    expect(result[0].json.sitePublication).toMatchObject({ status: "unchanged", commitSha: null });
    expect(httpRequest).toHaveBeenCalledTimes(1);
  });

  it("fails before any request when the GitHub token is absent", async () => {
    const httpRequest = vi.fn();
    await expect(execute(httpRequest, "")).rejects.toThrow(/GITHUB_TOKEN_VEILLE_IA/);
    expect(httpRequest).not.toHaveBeenCalled();
  });
});
