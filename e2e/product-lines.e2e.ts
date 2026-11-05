import { expect, test, type Page } from "@playwright/test";

const HOME = "/s/demo/de";
const switcher = (page: Page) => page.getByRole("navigation", { name: "Bereiche" });
const cards = (page: Page) => page.locator("main ul > li:has(a[href*='/p/'])");

for (const viewport of [
  { width: 360, height: 780 },
  { width: 1440, height: 900 },
]) {
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });
    let errors: string[] = [];
    test.beforeEach(({ page }) => {
      errors = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
    });
    test.afterEach(() => expect(errors).toEqual([]));

    test("home without ?line shows Outlet: every card reduced", async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      const tabs = switcher(page).getByRole("link");
      await expect(tabs).toHaveText(["Outlet", "Neu", "Second Story"]);
      await expect(switcher(page).locator("[aria-current=page]")).toHaveText("Outlet");
      await expect(switcher(page).getByRole("link", { name: "Second Story" })).toHaveAttribute("translate", "no");
      const n = await cards(page).count();
      expect(n).toBeGreaterThan(0);
      await expect(cards(page).locator("span.bg-accent")).toHaveCount(n);
    });

    test("Second Story: only second-hand cards, labelled; the choice stays when opening Herren", async ({ page }) => {
      await page.goto(HOME, { waitUntil: "networkidle" });
      await switcher(page).getByRole("link", { name: "Second Story" }).click();
      await expect(page).toHaveURL(/\?line=second-story$/);
      const n = await cards(page).count();
      expect(n).toBe(4);
      for (const card of await cards(page).all()) {
        await expect(card).toContainText(/Second Story · (Neu mit Etikett|Wie neu|Sehr gut|Gut)/);
        await expect(card).toContainText("Einzelstück");
      }
      if (viewport.width >= 768) {
        await page.locator("header nav[aria-label] a", { hasText: "Herren" }).click();
      } else {
        await page.locator("nav.fixed").getByRole("link", { name: "Kategorien" }).click();
        await expect(page).toHaveURL(/\/categories\?line=second-story$/);
        await page.locator("summary", { hasText: "Herren" }).click();
        await page.locator("details[open]").getByRole("link", { name: "Alle ansehen" }).click();
      }
      await expect(page).toHaveURL(/\/collections\/herren\?line=second-story$/);
      await expect(switcher(page).locator("[aria-current=page]")).toHaveText("Second Story");
      for (const card of await cards(page).all()) await expect(card).toContainText("Second Story");
    });

    test("/sale is a permanent redirect to the Outlet listing", async ({ page, request }) => {
      const res = await request.get(`${HOME}/sale`, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      expect(res.headers().location).toMatch(/\/s\/demo\/de\/products\?line=outlet$/);
      await page.goto(`${HOME}/sale`);
      await expect(page).toHaveURL(/\/products\?line=outlet$/);
    });

    test("the filter starts with Kategorie; «Nur reduziert» replaces «Nur Sale»", async ({ page }) => {
      await page.goto(`/s/demo/de/collections/herren?line=new`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: /^Filter/ }).click();
      const sheet = page.getByRole("dialog", { name: "Filter" });
      await expect(sheet.locator("h3").first()).toHaveText("Kategorie");
      await expect(sheet.getByText("Nur Sale")).toHaveCount(0);
    });

    test("a product without sizes says One Size; prices in a row on one line", async ({ page }) => {
      await page.goto(`/s/demo/de/products?line=new`, { waitUntil: "networkidle" });
      const beanie = cards(page).filter({ has: page.locator("a[href$='/p/beanie-alpin']") });
      await expect(beanie).toContainText("One Size");
      const box = (await beanie.boundingBox())!;
      // Cards in the beanie's row: their prices (last line) start at the same height.
      const prices = await cards(page).evaluateAll((lis, top) =>
        lis
          .filter((li) => Math.abs(li.getBoundingClientRect().top - (top as number)) < 2)
          .map((li) => Math.round(li.querySelector("p.tabular-nums")!.getBoundingClientRect().top)),
      box.y);
      expect(new Set(prices).size).toBe(1);
    });

    test("no switcher on a product, the cart or the wishlist", async ({ page }) => {
      for (const path of ["/p/jeansjacke-anna", "/cart", "/wishlist"]) {
        await page.goto(`${HOME}${path}`, { waitUntil: "networkidle" });
        await expect(switcher(page)).toHaveCount(0);
      }
      await page.goto(`${HOME}/p/jeansjacke-anna`);
      await expect(page.getByText("Verkauft von Anna, Lugano")).toBeVisible();
      await expect(page.getByText(/Second Story · Sehr gut · Einzelstück/)).toBeVisible();
    });
  });
}

test.describe("phone home", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("no category pills and no «Kategorien» block", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await expect(page.getByRole("navigation", { name: "Kategorien des Shops" })).toHaveCount(0);
    await expect(page.locator("main").getByRole("heading", { name: "Kategorien" })).toHaveCount(0);
    await expect(page.locator("section[aria-labelledby=categories]")).toHaveCount(0);
  });
});

test.describe("desktop menu", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test("no Sale in the menu", async ({ page }) => {
    await page.goto(HOME, { waitUntil: "networkidle" });
    await expect(page.locator("header nav[aria-label] a", { hasText: "Sale" })).toHaveCount(0);
  });
});
