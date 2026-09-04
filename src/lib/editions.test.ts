import { describe, expect, it } from "vitest";
import { getAllEditions, getEditionBySlug, getLatestEdition } from "./editions";

describe("edition content", () => {
  it("loads editions newest first", () => {
    const editions = getAllEditions();
    expect(editions.length).toBeGreaterThanOrEqual(5);
    expect(editions[0].slug).toBe("2026-09-04");
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
    expect(getLatestEdition().slug).toBe("2026-09-04");
  });
});
