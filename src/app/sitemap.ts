import type { MetadataRoute } from "next";
import { getAllEditions } from "@/lib/editions";
import { resolveSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolveSiteUrl();
  if (!baseUrl) return [];
  return [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/editions`, changeFrequency: "daily", priority: 0.8 },
    ...getAllEditions().map((edition) => ({
      url: `${baseUrl}/editions/${edition.slug}`,
      lastModified: new Date(edition.generatedAt),
      changeFrequency: "never" as const,
      priority: 0.7,
    })),
  ];
}
