import type { Metadata } from "next";
import {
  ArchiveCalendar,
  EditionList,
  SiteFooter,
  SiteHeader,
} from "@/components/editorial";
import { getAllEditions } from "@/lib/editions";
export const metadata: Metadata = {
  title: "Toutes les éditions",
  description:
    "Parcourez les sélections quotidiennes, rétrospectives et hebdomadaires de la veille IA depuis juillet 2026.",
};
export default function EditionsPage() {
  const editions = getAllEditions();
  const weekly = editions.filter((edition) => edition.kind === "weekly");
  return (
    <div className="shell">
      <SiteHeader />
      <main className="archive-page" id="contenu">
        <p className="page-kicker">Les archives</p>
        <h1>Toutes les éditions</h1>
        <p className="page-intro">
          Les quotidiennes, rétrospectives et hebdos sourcés depuis juillet,
          accessibles directement par date.
        </p>
        <section id="hebdo" aria-labelledby="hebdo-title">
          <p className="page-kicker">Hebdo</p>
          <h2 id="hebdo-title">La semaine IA</h2>
          <EditionList editions={weekly} />
        </section>
        <ArchiveCalendar editions={editions} />
        <div className="archive-list-heading">
          <p className="page-kicker">Lecture chronologique</p>
          <h2>Toutes les publications</h2>
        </div>
        <EditionList editions={editions} />
      </main>
      <SiteFooter />
    </div>
  );
}
