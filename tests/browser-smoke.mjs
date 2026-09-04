import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4188";
const browser = await chromium.launch({ headless: true });

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "4 septembre 2026" }).waitFor();
  if ((await page.locator(".hero-story").count()) !== 1) throw new Error("Hero principal absent");
  if ((await page.locator(".edition-card").count()) !== 4) throw new Error("Les quatre éditions précédentes ne sont pas visibles");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error(`Débordement horizontal ${viewport.name}`);

  await page.screenshot({ path: `artifacts/home-${viewport.name}.png`, fullPage: true });

  await page.getByRole("link", { name: /Toutes les éditions/i }).first().click();
  await page.waitForURL(`${base}/editions`);
  if ((await page.locator(".edition-row").count()) !== 5) throw new Error("Archive incomplète");
  await page.screenshot({ path: `artifacts/archives-${viewport.name}.png`, fullPage: true });

  await page.locator('.edition-row[href="/editions/2026-09-03"]').click();
  await page.waitForURL(`${base}/editions/2026-09-03`);
  await page.getByRole("heading", { name: "3 septembre 2026" }).waitFor();
  if ((await page.getByRole("navigation", { name: "Naviguer entre les éditions" }).count()) !== 1) throw new Error("Navigation entre éditions absente");
  if (errors.length) throw new Error(`Erreurs console ${viewport.name}: ${errors.join(" | ")}`);
  await page.close();
}

await browser.close();
console.log("OK: accueil, 4 éditions précédentes, archive 5 éditions, page datée, navigation précédente/suivante, desktop/mobile, aucun débordement ni erreur console");
