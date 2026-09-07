import { describe, expect, it } from "vitest";
import {
  getAllEditions,
  getEditionBySlug,
  getLatestEdition,
  validateEdition,
} from "./editions";

describe("edition content", () => {
  it("loads editions newest first", () => {
    const editions = getAllEditions();
    expect(editions.length).toBeGreaterThanOrEqual(5);
    expect(editions.map((edition) => edition.slug)).toEqual(
      [...editions]
        .sort((a, b) => {
          const date = (b.publicationDate ?? b.slug.slice(-10)).localeCompare(
            a.publicationDate ?? a.slug.slice(-10),
          );
          return (
            date ||
            (a.kind === "daily"
              ? -1
              : b.kind === "daily"
                ? 1
                : a.slug.localeCompare(b.slug))
          );
        })
        .map((edition) => edition.slug),
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

  it("keeps the most recent daily edition on the homepage when weekly editions exist", () => {
    const editions = getAllEditions();
    const latestDaily = editions.find((edition) => edition.kind === "daily");
    expect(latestDaily).toBeDefined();
    expect(getLatestEdition()).toEqual(latestDaily);
    expect(getLatestEdition().kind).toBe("daily");
  });

  it("loads the weekly edition with its premium contract and orders it after the daily on the same date", () => {
    const weekly = getEditionBySlug("hebdo-2026-09-06");
    expect(weekly).toMatchObject({
      kind: "weekly",
      publicationDate: "2026-09-06",
      periodStart: "2026-08-31",
      periodEnd: "2026-09-06",
      readingMinutes: 5,
    });
    expect(weekly?.stories).toHaveLength(5);
    expect(weekly?.insights).toHaveLength(3);
    expect(weekly?.watchlist?.length).toBeGreaterThanOrEqual(2);
    expect(weekly?.watchlist?.length).toBeLessThanOrEqual(3);
    const editions = getAllEditions();
    const dailyIndex = editions.findIndex(
      (edition) => edition.slug === "2026-09-06",
    );
    expect(dailyIndex).toBeGreaterThanOrEqual(0);
    expect(
      editions.slice(dailyIndex, dailyIndex + 2).map((edition) => edition.slug),
    ).toEqual(["2026-09-06", "hebdo-2026-09-06"]);
  });

  it("covers the archive back to early July without disguising retrospectives as daily editions", () => {
    const editions = getAllEditions();
    expect(editions.length).toBeGreaterThanOrEqual(21);
    expect(editions.at(-1)?.slug).toBe("2026-07-05");
    expect(
      editions.filter((edition) => edition.kind === "retrospective"),
    ).toHaveLength(8);
    expect(
      editions.filter((edition) => edition.kind !== "retrospective").length,
    ).toBeGreaterThanOrEqual(13);
  });

  it("keeps every retrospective source inside its declared period", () => {
    const retrospectives = getAllEditions().filter(
      (edition) => edition.kind === "retrospective",
    );
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

  it("rejects malformed ranks, required fields and weekly periods", () => {
    const weekly = getEditionBySlug("hebdo-2026-09-06");
    expect(weekly).toBeDefined();
    const copy = () => structuredClone(weekly!);

    const duplicateRank = copy();
    duplicateRank.stories[1].rank = 1;
    expect(validateEdition(duplicateRank)).toBe(false);

    const missingField = copy();
    missingField.stories[0].originalTitle = "";
    expect(validateEdition(missingField)).toBe(false);

    const invalidAccent = copy();
    invalidAccent.stories[0].accent = "green" as never;
    expect(validateEdition(invalidAccent)).toBe(false);

    const shortPeriod = copy();
    shortPeriod.periodStart = "2026-09-01";
    expect(validateEdition(shortPeriod)).toBe(false);

    const nonSunday = copy();
    nonSunday.slug = "hebdo-2026-09-05";
    nonSunday.publicationDate = "2026-09-05";
    nonSunday.periodStart = "2026-08-30";
    nonSunday.periodEnd = "2026-09-05";
    expect(validateEdition(nonSunday)).toBe(false);

    const outsidePeriod = copy();
    outsidePeriod.stories[0].publishedAt = "2026-08-30T12:00:00.000Z";
    expect(validateEdition(outsidePeriod)).toBe(false);

    const impossibleDate = copy();
    impossibleDate.stories[0].publishedAt = "2026-02-30T12:00:00.000Z";
    expect(validateEdition(impossibleDate)).toBe(false);

    const invalidMetadata = copy();
    invalidMetadata.editionNumber = 0;
    invalidMetadata.readingMinutes = 0;
    expect(validateEdition(invalidMetadata)).toBe(false);
  });
});
