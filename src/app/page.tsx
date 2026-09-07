import {
  ArchiveCards,
  EditionHero,
  SiteFooter,
  SiteHeader,
  WeeklyFeature,
} from "@/components/editorial";
import {
  getAllEditions,
  getLatestEdition,
  getLatestWeeklyEdition,
} from "@/lib/editions";
export default function Home() {
  const latest = getLatestEdition();
  const weekly = getLatestWeeklyEdition();
  const previous = getAllEditions()
    .filter(
      (edition) => edition.slug !== latest.slug && edition.kind !== "weekly",
    )
    .slice(0, 4);
  return (
    <div className="shell">
      <SiteHeader />
      <main id="contenu">
        <EditionHero edition={latest} />
        <WeeklyFeature edition={weekly} />
        <ArchiveCards editions={previous} />
      </main>
      <SiteFooter />
    </div>
  );
}
