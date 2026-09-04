import type { Metadata, Viewport } from "next";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#f2efe8",
};

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: { default: "Veille / IA", template: "%s — Veille / IA" },
  description: "Trois informations par jour pour comprendre ce qui change vraiment dans l’intelligence artificielle.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Veille / IA",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
