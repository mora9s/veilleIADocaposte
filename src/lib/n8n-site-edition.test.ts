import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const validItems = Array.from({ length: 3 }, (_, index) => ({
  headline_fr: `Une actualité IA suffisamment détaillée pour le site numéro ${index + 1}`,
  title: `Titre original suffisamment explicite numéro ${index + 1}`,
  summary_fr: `Un résumé complet de cette information numéro ${index + 1}, suffisamment long pour alimenter correctement la carte éditoriale du site internet.`,
  summary: `Résumé original numéro ${index + 1}`,
  source: `Source ${index + 1}`,
  category: "Modèles / agents",
  canonicalUrl: `https://example.org/article-${index + 1}`,
  publishedAt: "2026-09-04T05:00:00Z",
}));

describe("n8n site edition node", () => {
  it("builds a static edition without removing the existing digest", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => Array<{ json: Record<string, unknown> }>;
    const result = execute({ first: () => ({ json: {
      generatedAt: "2026-09-04T06:01:45.142Z",
      teamsMarkdown: "digest existant",
      tts: { publicUrl: "https://drive.google.com/file/d/audio/view" },
      selectedItems: validItems,
    } }) });

    expect(result[0].json.teamsMarkdown).toBe("digest existant");
    const siteEdition = result[0].json.siteEdition as { stories: unknown[] };
    expect(siteEdition).toMatchObject({
      slug: "2026-09-04",
      dateLabel: "4 septembre 2026",
      weekday: "Vendredi",
      editionNumber: 126,
      audioUrl: "https://drive.google.com/file/d/audio/view",
    });
    expect(siteEdition.stories).toHaveLength(3);
  });

  it("uses a valid fallback date instead of the execution clock", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => Array<{ json: { siteEdition: { slug: string } } }>;
    const result = execute({ first: () => ({ json: {
      date: "2026-01-02T08:00:00+01:00",
      selectedItems: validItems,
    } }) });
    expect(result[0].json.siteEdition.slug).toBe("2026-01-02");
  });

  it("rejects incomplete stories before they reach GitHub", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => unknown;
    const incomplete = [...validItems];
    incomplete[1] = { ...incomplete[1], source: "" };
    expect(() => execute({ first: () => ({ json: {
      generatedAt: "2026-09-04T06:01:45.142Z",
      selectedItems: incomplete,
    } }) })).toThrow(/invalide/i);
  });

  it("rejects any cardinality other than exactly three stories", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const execute = new Function("$input", source) as (input: { first: () => { json: unknown } }) => unknown;
    expect(() => execute({ first: () => ({ json: {
      generatedAt: "2026-09-04T06:01:45.142Z",
      selectedItems: validItems.slice(0, 2),
    } }) })).toThrow(/exactement 3/i);
  });
});
