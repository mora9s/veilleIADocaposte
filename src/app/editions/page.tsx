import type { Metadata } from "next";
import { ArchiveCalendar, EditionList, SiteFooter, SiteHeader } from "@/components/editorial";
import { getAllEditions } from "@/lib/editions";

export const metadata: Metadata = {
  title: "Toutes les éditions",
  description: "Parcourez les sélections quotidiennes et rétrospectives de la veille IA depuis juillet 2026.",
};

export default function EditionsPage() {
  const editions = getAllEditions();
  return (
    <div className="shell">
      <SiteHeader />
      <main className="archive-page" id="contenu">
        <p className="page-kicker">Les archives</p>
        <h1>Toutes les éditions</h1>
        <p className="page-intro">Les éditions quotidiennes issues de n8n et les rétrospectives sourcées depuis juillet, accessibles directement par date.</p>
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
