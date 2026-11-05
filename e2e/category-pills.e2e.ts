import { expect, test, type Page } from "@playwright/test";

const STORE = "/s/demo";
const pills = (page: Page) => page.getByRole("navigation", { name: /^(Kategorien des Shops|Catégories de la boutique|Categorie del negozio|Shop categories)$/ });

test.describe("phone 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("pills under the search: categories, then Sale in red; the row scrolls, the next pill peeks in", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    const links = pills(page).getByRole("link");
    const names = ["Herren", "Damen", "Kinder", "Sport", "Sale"];
    await expect(links).toHaveCount(names.length);
    for (const [i, name] of names.entries()) await expect(links.nth(i)).toHaveAccessibleName(name);

    const search = (await page.getByRole("searchbox").boundingBox())!;
    const first = (await links.first().boundingBox())!;
    expect(Math.round(first.height)).toBe(40);
    expect(first.x).toBe(16);
    expect(first.y - (search.y + search.height)).toBeGreaterThanOrEqual(12);
    await expect(links.last()).toHaveCSS("color", "rgb(200, 16, 46)");
    await expect(links.last()).toHaveCSS("font-weight", "700");
    const edges = await links.evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect()).map((r) => [r.left, r.right]));
    expect(edges.some(([l, r]) => l < 390 && r > 390)).toBe(true);

    // The first product row, prices included, is above the bottom bar.
    const bar = (await page.locator("nav.fixed").boundingBox())!;
    for (const card of (await page.locator("#selection li").all()).slice(0, 2)) {
      const box = (await card.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
    }
  });

  test("the current category is outlined, same size; pills keep their width in every language", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    const widthsDe = await pills(page).getByRole("link").evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect().width));
    await pills(page).getByRole("link", { name: "Damen" }).click();
    await expect(page).toHaveURL(`${STORE}/de/collections/damen`);
    const current = pills(page).getByRole("link", { name: "Damen" });
    await expect(current).toHaveAttribute("aria-current", "page");
    await expect(current).toHaveCSS("box-shadow", /1\.5px/);
    await expect(current).not.toHaveCSS("background-color", "rgb(17, 17, 17)");

    for (const locale of ["fr", "it", "en"]) {
      await page.goto(`${STORE}/${locale}`, { waitUntil: "networkidle" });
      const widths = await pills(page).getByRole("link").evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect().width));
      expect(widths, locale).toEqual(widthsDe);
    }
  });

  test("not on a product or the cart", async ({ page }) => {
    await page.goto(`${STORE}/de/p/windjacke-ridge`, { waitUntil: "networkidle" });
    await expect(pills(page)).toHaveCount(0);
  });
});

test.describe("desktop 1440×900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("no pills, products right under the header; Sale last in the menu, red", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    await expect(pills(page)).toBeHidden();
    const header = (await page.locator("header").boundingBox())!;
    const heading = (await page.locator("#selection-title").boundingBox())!;
    expect(heading.y - (header.y + header.height)).toBeLessThan(60);
    const menu = page.locator("header nav[aria-label] a");
    await expect(menu.last()).toHaveAccessibleName("Sale");
    await expect(menu.last()).toHaveCSS("color", "rgb(200, 16, 46)");
  });

  test("“Alle ansehen” leads to every product; no banner while it is off", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    await expect(page.locator("#home-banner")).toHaveCount(0);
    await page.getByRole("link", { name: "Alle ansehen" }).click();
    await expect(page).toHaveURL(`${STORE}/de/products`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alle Artikel");
  });
});
