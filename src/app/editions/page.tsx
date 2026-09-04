import type { Metadata } from "next";
import { EditionList, SiteFooter, SiteHeader } from "@/components/editorial";
import { getAllEditions } from "@/lib/editions";

export const metadata: Metadata = {
  title: "Toutes les éditions",
  description: "Retrouvez les précédentes sélections quotidiennes de la veille IA.",
};

export default function EditionsPage() {
  const editions = getAllEditions();
  return (
    <div className="shell">
      <SiteHeader />
      <main className="archive-page" id="contenu">
        <p className="page-kicker">Les archives</p>
        <h1>Toutes les éditions</h1>
        <p className="page-intro">Chaque matin, trois informations pour comprendre ce qui change vraiment dans l’intelligence artificielle.</p>
        <EditionList editions={editions} />
      </main>
      <SiteFooter />
    </div>
  );
}
