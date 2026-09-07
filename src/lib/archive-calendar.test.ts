import { describe, expect, it } from "vitest";
import type { Edition } from "./editions";
import { buildArchiveCalendar } from "./archive-calendar";

function edition(slug: string, kind: Edition["kind"] = "daily"): Edition {
  return {
    slug,
    kind,
    dateLabel: slug,
    weekday: "",
    editionNumber: 1,
    readingMinutes: 4,
    dek: "Une édition de test suffisamment détaillée",
    stories: [],
    audioUrl: null,
    generatedAt: `${slug}T08:00:00.000Z`,
  };
}

describe("archive calendar", () => {
  it("groups editions by month newest first and fills Monday-first weeks", () => {
    const months = buildArchiveCalendar([
      edition("2026-07-05", "retrospective"),
      edition("2026-08-22"),
      edition("2026-09-04"),
    ]);

    expect(months.map((month) => month.key)).toEqual([
      "2026-09",
      "2026-08",
      "2026-07",
    ]);
    expect(months[0].cells).toHaveLength(35);
    expect(months[0].cells[0]?.day).toBeNull();
    expect(
      months[0].cells.find((cell) => cell.day === 4)?.editions[0]?.slug,
    ).toBe("2026-09-04");
  });

  it("keeps retrospective editions identifiable", () => {
    const [month] = buildArchiveCalendar([
      edition("2026-07-05", "retrospective"),
    ]);
    const cell = month.cells.find((candidate) => candidate.day === 5);
    expect(cell?.editions[0]?.kind).toBe("retrospective");
  });

  it("represents daily and weekly editions sharing a publication date with distinct links", () => {
    const weekly = {
      ...edition("hebdo-2026-09-06", "weekly"),
      publicationDate: "2026-09-06",
    };
    const [month] = buildArchiveCalendar([edition("2026-09-06"), weekly]);
    const cell = month.cells.find((candidate) => candidate.day === 6);
    expect(cell?.editions.map((entry) => entry.slug)).toEqual([
      "2026-09-06",
      "hebdo-2026-09-06",
    ]);
  });
});
