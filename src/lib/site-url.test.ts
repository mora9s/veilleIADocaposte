import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("site URL resolution", () => {
  it("prefers the explicit public URL", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://news.example/", VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app" })).toBe("https://news.example");
  });

  it("uses Vercel's production URL when no custom domain is configured", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "veille-ia.vercel.app" })).toBe("https://veille-ia.vercel.app");
  });
});
