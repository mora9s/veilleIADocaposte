import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("n8n site edition node", () => {
  it("builds a static edition without removing the existing digest", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => Array<{ json: Record<string, unknown> }>;
    const result = execute({
      first: () => ({
        json: {
          generatedAt: "2026-09-04T06:01:45.142Z",
          teamsMarkdown: "digest existant",
          tts: { publicUrl: "https://drive.google.com/file/d/audio/view" },
          selectedItems: [
            {
              headline_fr: "Une actualité IA suffisamment détaillée pour le site",
              title: "Titre original",
              summary_fr: "Un résumé complet de cette information, suffisamment long pour alimenter correctement la carte éditoriale du site internet.",
              summary: "Résumé original",
              source: "Source test",
              category: "Modèles / agents",
              canonicalUrl: "https://example.org/article",
              publishedAt: "2026-09-04T05:00:00Z",
            },
          ],
        },
      }),
    });

    expect(result[0].json.teamsMarkdown).toBe("digest existant");
    expect(result[0].json.siteEdition).toMatchObject({
      slug: "2026-09-04",
      dateLabel: "4 septembre 2026",
      weekday: "Vendredi",
      editionNumber: 126,
      audioUrl: "https://drive.google.com/file/d/audio/view",
    });
  });

  it("uses a valid fallback date instead of the execution clock", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => Array<{ json: { siteEdition: { slug: string } } }>;
    const result = execute({ first: () => ({ json: {
      date: "2026-01-02T08:00:00+01:00",
      selectedItems: [{
        title: "Titre original suffisamment explicite",
        summary: "Résumé complet contenant assez de matière éditoriale pour présenter proprement cette information sur le site.",
        source: "Source test",
        url: "https://example.org/article",
      }],
    } }) });
    expect(result[0].json.siteEdition.slug).toBe("2026-01-02");
  });

  it("rejects incomplete stories before they reach GitHub", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => unknown;
    expect(() => execute({ first: () => ({ json: {
      generatedAt: "2026-09-04T06:01:45.142Z",
      selectedItems: [{ title: "Titre sans source ni URL", summary: "Résumé incomplet" }],
    } }) })).toThrow(/invalide/i);
  });
});
