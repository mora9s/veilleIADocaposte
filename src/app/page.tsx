import { ArchiveCards, EditionHero, SiteFooter, SiteHeader } from "@/components/editorial";
import { getAllEditions, getLatestEdition } from "@/lib/editions";

export default function Home() {
  const latest = getLatestEdition();
  const previous = getAllEditions().slice(1, 5);

  return (
    <div className="shell">
      <SiteHeader />
      <main id="contenu">
        <EditionHero edition={latest} />
        <ArchiveCards editions={previous} />
      </main>
      <SiteFooter />
    </div>
  );
}
