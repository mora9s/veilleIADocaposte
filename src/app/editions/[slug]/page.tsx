import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditionHero, SiteFooter, SiteHeader } from "@/components/editorial";
import {
  getAdjacentEditions,
  getAllEditions,
  getEditionBySlug,
} from "@/lib/editions";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllEditions().map((edition) => ({ slug: edition.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const edition = getEditionBySlug(slug);
  if (!edition) return {};
  return {
    title:
      edition.kind === "weekly"
        ? `La semaine IA — ${edition.dateLabel}`
        : `Édition du ${edition.dateLabel}`,
    description: edition.dek,
  };
}

export default async function EditionPage({ params }: Props) {
  const { slug } = await params;
  const edition = getEditionBySlug(slug);
  if (!edition) notFound();
  const { newer, older } = getAdjacentEditions(slug);

  return (
    <div className="shell">
      <SiteHeader />
      <main id="contenu">
        <EditionHero edition={edition} />
        <nav
          className="edition-pagination"
          aria-label="Naviguer entre les éditions"
        >
          {older ? (
            <Link href={`/editions/${older.slug}`}>← {older.dateLabel}</Link>
          ) : (
            <span />
          )}
          <Link href="/editions">Toutes les éditions</Link>
          {newer ? (
            <Link href={`/editions/${newer.slug}`}>{newer.dateLabel} →</Link>
          ) : (
            <Link href="/">Aujourd’hui →</Link>
          )}
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
