import { expect, test, type Page } from "@playwright/test";

const HERREN = "/s/demo/de/collections/herren";
const cards = (page: Page) => page.locator("main ul > li:has(a[href*='/p/'])");
const sizesLine = (page: Page) => cards(page).locator("p.text-xs");
const filterButton = (page: Page) => page.getByRole("button", { name: /^Filter/ });
const sheet = (page: Page) => page.getByRole("dialog", { name: "Filter" });

async function prices(page: Page) {
  return cards(page).evaluateAll((lis) =>
    lis.map((li) => {
      const text = li.querySelector("p.pt-0\\.5 span")?.textContent ?? "";
      return { price: Number(text.replace(/[^\d.]/g, "")), soldOut: /Ausverkauft/.test(li.textContent ?? "") };
    }),
  );
}

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

    test("size M: every card offers M; the count on the button follows the choice", async ({ page }) => {
      await page.goto(HERREN, { waitUntil: "networkidle" });
      await filterButton(page).click();
      const show = sheet(page).getByRole("button", { name: /Artikel anzeigen$/ });
      const before = await show.textContent();
      await sheet(page).getByRole("button", { name: "M", exact: true }).click();
      await expect(sheet(page).getByRole("button", { name: "M", exact: true })).toHaveAttribute("aria-pressed", "true");
      await sheet(page).getByRole("button", { name: "XL", exact: true }).click();
      await sheet(page).getByRole("button", { name: "XL", exact: true }).click();
      expect(await show.textContent()).toMatch(/^\d+ Artikel anzeigen$/);
      const shown = Number((await show.textContent())!.match(/\d+/)![0]);
      expect(shown).toBeLessThanOrEqual(Number(before!.match(/\d+/)![0]));
      await show.click();
      await expect(page).toHaveURL(/[?&]size=M(&|$)/);
      await expect(cards(page)).toHaveCount(shown);
      for (const line of await sizesLine(page).allTextContents()) expect(line).toMatch(/(^|· |noch )M( ·|$)/);
      await expect(filterButton(page)).toHaveAccessibleName("Filter (1)");
      await expect(page.getByRole("link", { name: "M entfernen" })).toBeVisible();
    });

    test("only reduced: every card shows a discount", async ({ page }) => {
      await page.goto(`${HERREN}?line=new`, { waitUntil: "networkidle" }); // Neu: some reduced, some not
      await filterButton(page).click();
      await sheet(page).getByLabel("Nur reduziert").check();
      await sheet(page).getByRole("button", { name: /Artikel anzeigen$/ }).click();
      await expect(page).toHaveURL(/[?&]sale=1/);
      const n = await cards(page).count();
      expect(n).toBeGreaterThan(0);
      await expect(cards(page).locator("span.bg-accent")).toHaveCount(n);
    });

    test("price ascending; sold-out products last; the price fields are 16px", async ({ page }) => {
      await page.goto(`${HERREN}?sort=price_asc`, { waitUntil: "networkidle" });
      const list = await prices(page);
      const available = list.filter((p) => !p.soldOut).map((p) => p.price);
      expect(available).toEqual([...available].sort((a, b) => a - b));
      const firstSoldOut = list.findIndex((p) => p.soldOut);
      if (firstSoldOut >= 0) expect(list.slice(firstSoldOut).every((p) => p.soldOut)).toBe(true);

      await filterButton(page).click();
      for (const field of await sheet(page).locator("input[inputmode=decimal]").all()) {
        await expect(field).toHaveCSS("font-size", "16px");
      }
    });

    test("Back restores the filters", async ({ page }) => {
      await page.goto(`${HERREN}?size=M`, { waitUntil: "networkidle" });
      await page.goto(`${HERREN}?size=M&sort=price_desc`, { waitUntil: "networkidle" });
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${HERREN}\\?size=M$`));
      await expect(filterButton(page)).toHaveAccessibleName("Filter (1)");
      await expect(page.getByRole("link", { name: "M entfernen" })).toBeVisible();
    });

    test("nothing found, then reset; wrong values are ignored", async ({ page }) => {
      await page.goto(`${HERREN}?min=99999`, { waitUntil: "networkidle" });
      await expect(page.getByText("Keine Artikel gefunden")).toBeVisible();
      await page.getByRole("link", { name: "Filter zurücksetzen" }).click();
      await expect(page).toHaveURL(new RegExp(`${HERREN}$`));
      await expect(cards(page).first()).toBeVisible();

      const res = await page.goto(`${HERREN}?size=<x>&min=abc&sort=cheap&page=-1&brand=%%`);
      expect(res?.status()).toBe(200);
      await expect(filterButton(page)).toHaveAccessibleName("Filter");
    });

    test("Esc closes the sheet, focus goes back to Filter, the page behind doesn't scroll", async ({ page }) => {
      await page.goto(HERREN, { waitUntil: "networkidle" });
      await filterButton(page).click();
      await expect(sheet(page)).toBeVisible();
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe("hidden");
      await page.keyboard.press("Escape");
      await expect(sheet(page)).toBeHidden();
      await expect(filterButton(page)).toBeFocused();
      await filterButton(page).click();
      await sheet(page).getByRole("button", { name: "Schliessen" }).click();
      await expect(filterButton(page)).toBeFocused();
    });
  });
}

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the filter line sticks under the header while the page scrolls", async ({ page }) => {
    await page.goto("/s/demo/de/products?line=new", { waitUntil: "networkidle" }); // long enough to scroll
    await page.evaluate(() => window.scrollTo(0, 900));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const header = (await page.locator("header").boundingBox())!;
    const button = (await filterButton(page).boundingBox())!;
    expect(button.y).toBeGreaterThanOrEqual(header.y + header.height - 1);
    expect(button.y).toBeLessThan(header.y + header.height + 30);
  });

  test("Outlet listing: the same filters, no «only reduced» (all reduced)", async ({ page }) => {
    await page.goto("/s/demo/de/products?line=outlet", { waitUntil: "networkidle" });
    await filterButton(page).click();
    await expect(sheet(page).getByLabel("Nur reduziert")).toHaveCount(0);
    await expect(sheet(page).getByRole("heading", { name: "Grösse" })).toBeVisible();
  });
});
