import { expect, test, type Page } from "@playwright/test";

const STORE = "/s/demo";
const tiles = (page: Page) => page.getByRole("navigation", { name: /Kategorien des Shops|Catégories|Categorie del|Shop categories/ });

test.describe("phone 390×844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("tiles scroll sideways, 92×112, the next one peeks in; the first product row is on the first screen", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    const links = tiles(page).getByRole("link");
    const names = ["Herren", "Damen", "Kinder", "Sport", "Sale"];
    await expect(links).toHaveCount(names.length);
    for (const [i, name] of names.entries()) await expect(links.nth(i)).toHaveAccessibleName(name);
    const first = (await links.first().locator("span").first().boundingBox())!;
    expect([Math.round(first.width), Math.round(first.height)]).toEqual([92, 112]);
    expect(first.x).toBe(16);
    // The row scrolls; a tile is cut by the right edge.
    const row = tiles(page).locator("ul");
    expect(await row.evaluate((ul) => ul.scrollWidth > ul.clientWidth)).toBe(true);
    const boxes = await links.evaluateAll((ls) => ls.map((l) => l.getBoundingClientRect()).map((r) => [r.left, r.right]));
    expect(boxes.some(([l, r]) => l < 390 && r > 390)).toBe(true);

    // First row of products, price included, above the bottom bar.
    const bar = (await page.locator("nav.fixed").boundingBox())!;
    for (const card of await page.locator("#selection li").all().then((cards) => cards.slice(0, 2))) {
      const box = (await card.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
    }
  });

  test("labels stay inside their tiles in every language", async ({ page }) => {
    for (const locale of ["de", "fr", "it", "en"]) {
      await page.goto(`${STORE}/${locale}`, { waitUntil: "networkidle" });
      const widths = await tiles(page)
        .getByRole("link")
        .evaluateAll((ls) => ls.map((l) => Math.round(l.getBoundingClientRect().width)));
      expect(new Set(widths), locale).toEqual(new Set([92]));
    }
  });
});

test.describe("desktop 1440×900", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("one row of equal 220px tiles, the name on the tile; products start on the first screen", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    const boxes = await tiles(page)
      .getByRole("link")
      .evaluateAll((ls) => ls.map((l) => l.firstElementChild!.getBoundingClientRect()));
    expect(boxes).toHaveLength(5);
    expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(1);
    expect(new Set(boxes.map((b) => Math.round(b.height)))).toEqual(new Set([220]));
    expect(new Set(boxes.map((b) => Math.round(b.width))).size).toBe(1);
    const firstProduct = (await page.locator("#selection li").first().boundingBox())!;
    expect(firstProduct.y).toBeLessThan(900);
  });

  test("names fit their tiles in every language", async ({ page }) => {
    for (const locale of ["de", "fr", "it", "en"]) {
      await page.goto(`${STORE}/${locale}`, { waitUntil: "networkidle" });
      const overflow = await tiles(page)
        .getByRole("link")
        .evaluateAll((ls) =>
          ls.filter((l) => {
            const tile = l.firstElementChild!.getBoundingClientRect();
            const name = l.firstElementChild!.lastElementChild!.getBoundingClientRect();
            return name.left < tile.left || name.right > tile.right || name.bottom > tile.bottom;
          }).length,
        );
      expect(overflow, locale).toBe(0);
    }
  });

  test("Sale: last in the header menu, red, and a tile, both leading to the reduced products", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    const menu = page.locator("header nav[aria-label] a");
    await expect(menu.last()).toHaveText("Sale");
    await expect(menu.last()).toHaveCSS("color", "rgb(200, 16, 46)");
    await expect(tiles(page).getByRole("link").last()).toHaveAttribute("href", `${STORE}/de/sale`);
    await tiles(page).getByRole("link", { name: "Sale" }).click();
    await expect(page).toHaveURL(`${STORE}/de/sale`);
    await expect(page.locator("main li").first()).toBeVisible();
  });

  test("“Alle ansehen” leads to every product", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Alle ansehen" }).click();
    await expect(page).toHaveURL(`${STORE}/de/products`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alle Artikel");
  });

  test("no banner while it is switched off in the settings", async ({ page }) => {
    await page.goto(`${STORE}/de`);
    await expect(page.locator("#home-banner")).toHaveCount(0);
  });
});
