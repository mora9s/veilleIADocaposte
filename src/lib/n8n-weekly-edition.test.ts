import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const validItems = Array.from({ length: 5 }, (_, index) => ({
  headline_fr: `Une actualité IA hebdomadaire suffisamment détaillée numéro ${index + 1}`,
  title: `Titre original hebdomadaire suffisamment explicite numéro ${index + 1}`,
  summary_fr: `Un résumé complet de cette information hebdomadaire numéro ${index + 1}, suffisamment long pour alimenter correctement la sélection éditoriale.`,
  source: `Source ${index + 1}`,
  category: "Modèles / agents",
  canonicalUrl: `https://example.org/weekly-${index + 1}`,
  publishedAt: "2026-09-04T05:00:00Z",
}));

const validInput = {
  generatedAt: "2026-09-06T18:00:00+02:00",
  periodStart: "2026-08-31",
  periodEnd: "2026-09-06",
  selectedItems: validItems,
  insights: Array.from({ length: 3 }, (_, index) => ({
    title: `Enseignement ${index + 1}`,
    body: `Une synthèse prudente suffisamment développée pour l'enseignement transversal numéro ${index + 1}.`,
  })),
  watchlist: ["À surveiller : premier point", "À surveiller : deuxième point"],
};

function execute(input: Record<string, unknown>) {
  const source = fs.readFileSync(
    path.join(process.cwd(), "automation", "n8n-build-weekly-edition.js"),
    "utf8",
  );
  return vm.runInNewContext(`(function () {\n${source}\n})()`, {
    $input: { first: () => ({ json: input }) },
  }) as Array<{
    json: Record<string, unknown> & { siteEdition: Record<string, unknown> };
  }>;
}

describe("n8n weekly edition node", () => {
  it("builds and preserves a five-story weekly edition in the isolated Code-node VM", () => {
    const result = execute({ ...validInput, teamsMarkdown: "digest existant" });
    expect(result[0].json.teamsMarkdown).toBe("digest existant");
    expect(result[0].json.siteEdition).toMatchObject({
      slug: "hebdo-2026-09-06",
      kind: "weekly",
      publicationDate: "2026-09-06",
      periodStart: "2026-08-31",
      periodEnd: "2026-09-06",
      editionNumber: 1,
      readingMinutes: 5,
    });
    expect(result[0].json.siteEdition.stories as unknown[]).toHaveLength(5);
    expect(result[0].json.siteEdition.insights as unknown[]).toHaveLength(3);
    expect(result[0].json.siteEdition.watchlist as unknown[]).toHaveLength(2);
  });

  it("requires and carries a real six or seven-minute audio duration when weekly audio exists", () => {
    const result = execute({
      ...validInput,
      audioUrl: "https://example.org/audio.mp3",
      audioMinutes: 7,
    });
    expect(result[0].json.siteEdition.audioMinutes).toBe(7);
    expect(() =>
      execute({
        ...validInput,
        audioUrl: "https://example.org/audio.mp3",
        audioMinutes: 5,
      }),
    ).toThrow(/audioMinutes/);
  });

  it("rejects an invalid weekly period and malformed story fields", () => {
    expect(() => execute({ ...validInput, periodStart: "2026-09-01" })).toThrow(
      /sept jours/i,
    );
    expect(() => execute({ ...validInput, periodEnd: "2026-09-05" })).toThrow(
      /dimanche|déterministe/i,
    );
    expect(() =>
      execute({ ...validInput, generatedAt: "2026-02-30T18:00:00Z" }),
    ).toThrow(/Date invalide/i);
    expect(() =>
      execute({
        ...validInput,
        selectedItems: [
          { ...validItems[0], publishedAt: "2026-08-30T05:00:00Z" },
          ...validItems.slice(1),
        ],
      }),
    ).toThrow(/période/i);
    expect(() =>
      execute({
        ...validInput,
        selectedItems: [
          { ...validItems[0], category: "" },
          ...validItems.slice(1),
        ],
      }),
    ).toThrow(/catégorie/i);
  });

  it("rejects missing weekly cardinalities and insecure URLs", () => {
    expect(() =>
      execute({ ...validInput, selectedItems: validItems.slice(0, 4) }),
    ).toThrow(/exactement 5/i);
    expect(() =>
      execute({ ...validInput, insights: validInput.insights.slice(0, 2) }),
    ).toThrow(/exactement 3/i);
    expect(() => execute({ ...validInput, watchlist: ["un"] })).toThrow(
      /2 à 3/i,
    );
    expect(() =>
      execute({
        ...validInput,
        selectedItems: [
          { ...validItems[0], canonicalUrl: "http://example.org/no" },
          ...validItems.slice(1),
        ],
      }),
    ).toThrow(/HTTPS/);
  });
});
