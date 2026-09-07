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
  if ((await page.locator(".edition-heading h1").count()) !== 1)
    throw new Error("Date du quotidien absente");
  if ((await page.locator(".hero-story").count()) !== 1)
    throw new Error("Hero quotidien absent");
  const weeklyLink = page
    .locator('.weekly-feature a[href^="/editions/hebdo-"]')
    .first();
  const weeklyHref = await weeklyLink.getAttribute("href");
  if (!weeklyHref) throw new Error("Lien hebdo dynamique absent de l’accueil");
  await weeklyLink.click();
  await page.waitForURL(`${base}${weeklyHref}`);
  await page.getByText(/La semaine IA · .+ au .+/i).waitFor();
  if ((await page.locator(".weekly-grid .story-card").count()) !== 4)
    throw new Error("Les quatre essentiels hebdo sont absents");
  await page.getByRole("heading", { name: "Les 4 essentiels" }).waitFor();
  const heroBox = await page.locator(".weekly-grid .hero-story").boundingBox();
  const essentialsBox = await page
    .locator(".weekly-grid .secondary-stories")
    .boundingBox();
  const firstEssentialBox = await page
    .locator(".weekly-grid .story-card")
    .first()
    .boundingBox();
  if (!heroBox || !essentialsBox || !firstEssentialBox)
    throw new Error(`Géométrie hebdo absente ${viewport.name}`);
  if (Math.abs(heroBox.width - essentialsBox.width) > 2)
    throw new Error(
      `Le signal fort et les essentiels ne respirent pas sur la même largeur ${viewport.name}`,
    );
  if (viewport.name === "desktop" && firstEssentialBox.width < 500)
    throw new Error(
      "Les cartes essentielles restent trop étroites sur desktop",
    );
  if (viewport.name === "mobile" && firstEssentialBox.width < 340)
    throw new Error("Les cartes essentielles restent trop étroites sur mobile");
  if (viewport.name === "mobile" && heroBox.height > 580)
    throw new Error("Le signal fort domine encore trop la hauteur mobile");
  await page.getByRole("heading", { name: "3 enseignements" }).waitFor();
  await page.getByText(/Ces points restent des éléments à suivre/i).waitFor();
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  if (overflow) throw new Error(`Débordement horizontal ${viewport.name}`);
  await page.goto(`${base}/editions`, { waitUntil: "networkidle" });
  const publicationDate = weeklyHref.replace("/editions/hebdo-", "");
  const sharedDay = page
    .locator(
      `.calendar-day.available:has(a[href="${weeklyHref}"]):has(a[href="/editions/${publicationDate}"])`,
    )
    .first();
  if ((await sharedDay.count()) !== 1)
    throw new Error(
      "Les formats quotidien et hebdo ne coexistent pas dans une même case",
    );
  const calendarLinks = page.locator(".calendar-day.available a");
  for (const link of await calendarLinks.all()) {
    const box = await link.boundingBox();
    if (!box || box.width < 44 || box.height < 44)
      throw new Error(`Cible calendrier trop petite ${viewport.name}`);
  }
  const dailyLink = page
    .locator(".edition-row:has(.edition-kind.daily)")
    .first();
  await dailyLink.click();
  await page.locator(".lead-grid:not(.weekly-grid)").waitFor();
  await page.goto(`${base}/editions`, { waitUntil: "networkidle" });
  const retrospectiveLink = page
    .locator(".edition-row:has(.edition-kind.retrospective)")
    .first();
  await retrospectiveLink.click();
  await page.getByText(/Rétrospective · .+ au .+/i).waitFor();
  if (errors.length)
    throw new Error(`Erreurs console ${viewport.name}: ${errors.join(" | ")}`);
  await page.close();
}
await browser.close();
console.log(
  "OK: quotidien, hebdo réel desktop/mobile, calendrier multi-format, enseignements/watchlist, aucun débordement ni erreur console",
);
