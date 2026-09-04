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
  if ((await page.locator(".calendar-month").count()) !== 3) throw new Error("Les calendriers de juillet à septembre sont absents");
  if ((await page.locator(".calendar-day.available").count()) !== 21) throw new Error("Le calendrier ne contient pas les 21 publications");
  if ((await page.locator(".calendar-day.retrospective").count()) !== 8) throw new Error("Les huit rétrospectives ne sont pas identifiables");
  if ((await page.locator(".edition-row").count()) !== 21) throw new Error("Archive incomplète");
  await page.screenshot({ path: `artifacts/archives-${viewport.name}.png`, fullPage: true });

  await page.locator('.edition-row[href="/editions/2026-09-03"]').click();
  await page.waitForURL(`${base}/editions/2026-09-03`);
  await page.getByRole("heading", { name: "3 septembre 2026" }).waitFor();
  if ((await page.getByRole("navigation", { name: "Naviguer entre les éditions" }).count()) !== 1) throw new Error("Navigation entre éditions absente");

  await page.goto(`${base}/editions/2026-07-05`, { waitUntil: "networkidle" });
  await page.getByText(/Rétrospective · 1 juillet au 5 juillet/i).waitFor();
  if ((await page.locator(".story-card").count()) !== 2) throw new Error("Rétrospective incomplète");

  await page.goto(`${base}/editions/2026-08-23`, { waitUntil: "networkidle" });
  if ((await page.locator(".secondary-stories.single").count()) !== 1) throw new Error("L’édition historique à deux actualités est mal composée");
  if (errors.length) throw new Error(`Erreurs console ${viewport.name}: ${errors.join(" | ")}`);
  await page.close();
}

await browser.close();
console.log("OK: accueil, calendrier 3 mois/21 publications, 8 rétrospectives, page datée, navigation, desktop/mobile, aucun débordement ni erreur console");
