import { describe, expect, it } from "vitest";
import { getAllEditions, getEditionBySlug, getLatestEdition } from "./editions";

describe("edition content", () => {
  it("loads editions newest first", () => {
    const editions = getAllEditions();
    expect(editions.length).toBeGreaterThanOrEqual(5);
    expect(editions.map((edition) => edition.slug)).toEqual(
      [...editions.map((edition) => edition.slug)].sort().reverse(),
    );
  });

  it("provides a complete three-story daily edition", () => {
    const edition = getEditionBySlug("2026-09-04");
    expect(edition).toBeDefined();
    expect(edition?.stories).toHaveLength(3);
    for (const story of edition?.stories ?? []) {
      expect(story.title.length).toBeGreaterThan(20);
      expect(story.summary.length).toBeGreaterThan(80);
      expect(new URL(story.url).protocol).toBe("https:");
      expect(story.source.length).toBeGreaterThan(2);
    }
  });

  it("uses the most recent edition on the homepage", () => {
    expect(getLatestEdition()).toEqual(getAllEditions()[0]);
  });

  it("covers the archive back to early July without disguising retrospectives as daily editions", () => {
    const editions = getAllEditions();
    expect(editions.length).toBeGreaterThanOrEqual(21);
    expect(editions.at(-1)?.slug).toBe("2026-07-05");
    expect(editions.filter((edition) => edition.kind === "retrospective")).toHaveLength(8);
    expect(editions.filter((edition) => edition.kind !== "retrospective").length).toBeGreaterThanOrEqual(13);
  });

  it("keeps every retrospective source inside its declared period", () => {
    const retrospectives = getAllEditions().filter((edition) => edition.kind === "retrospective");
    for (const edition of retrospectives) {
      expect(edition.periodStart).toBeDefined();
      expect(edition.periodEnd).toBeDefined();
      for (const story of edition.stories) {
        const published = story.publishedAt.slice(0, 10);
        expect(published >= (edition.periodStart ?? "")).toBe(true);
        expect(published <= (edition.periodEnd ?? "")).toBe(true);
      }
      expect(edition.stories.map((story) => story.rank)).toEqual(
        edition.stories.map((_, index) => index + 1),
      );
    }
  });
});
