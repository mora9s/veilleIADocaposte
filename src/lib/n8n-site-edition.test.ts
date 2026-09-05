import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
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

  it("runs in the isolated n8n Code-node VM, where URL is not a global", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const input = {
      generatedAt: "2026-09-04T06:01:45.142Z",
      tts: { publicUrl: "https://drive.google.com/file/d/audio/view" },
      selectedItems: validItems,
    };
    const result = vm.runInNewContext(`(function () {\n${source}\n})()`, {
      $input: { first: () => ({ json: input }) },
    }) as Array<{ json: { siteEdition: { slug: string; stories: unknown[] } } }>;

    expect(result[0].json.siteEdition.slug).toBe("2026-09-04");
    expect(result[0].json.siteEdition.stories).toHaveLength(3);
  });

  it("still rejects a non-HTTPS story URL in the isolated VM", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "automation", "n8n-build-site-edition.js"), "utf8");
    const selectedItems = validItems.map((item, index) => index === 1
      ? { ...item, canonicalUrl: "http://example.org/not-secure" }
      : item);

    expect(() => vm.runInNewContext(`(function () {\n${source}\n})()`, {
      $input: { first: () => ({ json: { generatedAt: "2026-09-04T06:01:45.142Z", selectedItems } }) },
    })).toThrow(/URL HTTPS/);
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
