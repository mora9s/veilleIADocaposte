import type { Edition } from "./editions";

export type CalendarCell = {
  day: number | null;
  isoDate: string | null;
  edition?: Edition;
};

export type ArchiveCalendarMonth = {
  key: string;
  label: string;
  cells: CalendarCell[];
};

export function buildArchiveCalendar(editions: Edition[]): ArchiveCalendarMonth[] {
  const byMonth = new Map<string, Map<number, Edition>>();

  for (const edition of editions) {
    const key = edition.slug.slice(0, 7);
    const day = Number(edition.slug.slice(8, 10));
    const month = byMonth.get(key) ?? new Map<number, Edition>();
    month.set(day, edition);
    byMonth.set(key, month);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, monthEditions]) => {
      const [year, month] = key.split("-").map(Number);
      const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
      const cells = Array.from({ length: cellCount }, (_, index): CalendarCell => {
        const day = index - firstWeekday + 1;
        if (day < 1 || day > daysInMonth) return { day: null, isoDate: null };
        const isoDate = `${key}-${String(day).padStart(2, "0")}`;
        return { day, isoDate, edition: monthEditions.get(day) };
      });
      const label = new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, 1)));

      return { key, label: label.charAt(0).toUpperCase() + label.slice(1), cells };
    });
}
