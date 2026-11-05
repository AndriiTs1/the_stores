import { expect, test, type Page } from "@playwright/test";

/**
 * Switching DE → FR → IT → EN keeps the page still: no layout shift, header, menu and bottom bar in place, no new
 * document (client-side navigation), no product photo loaded again, the scroll position kept.
 * Phones switch in the account menu (#account), desktops in the header.
 */
const STORE = "/s/demo";
const PAGES = ["", "/collections/herren", "/p/windjacke-ridge"];

/**
 * Boxes of what must not move: header, its menu and search, the phone bar and its tabs, and the page's cards, chips and
 * buttons. Checked by position as well as by layout shift: the new language mounts fresh elements, which the
 * layout-shift metric doesn't count.
 */
const frame = (page: Page) =>
  page.evaluate(() =>
    [
      "header",
      "header a[href$='/de'], header a[href$='/fr'], header a[href$='/it'], header a[href$='/en']",
      "header nav[aria-label] a",
      "header form[role=search]",
      "nav.fixed li",
      "main li",
      "main a.btn, main button",
    ].flatMap((sel) =>
      [...document.querySelectorAll(sel)]
        .filter((el) => el.getClientRects().length > 0)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { sel, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        }),
    ),
  );

async function watchShifts(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __shift: number };
    w.__shift = 0;
    // All shifts, also those right after the click (hadRecentInput): a language switch must not move anything.
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__shift += (e as unknown as { value: number }).value;
    }).observe({ type: "layout-shift" });
  });
}
const shifts = (page: Page) => page.evaluate(() => (window as unknown as { __shift: number }).__shift);

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  const phone = viewport.width < 768;
  test.describe(`${viewport.width}px`, () => {
    test.use({ viewport });

    for (const path of PAGES) {
      test(`${path || "/"}: DE → FR → IT → EN without a jump`, async ({ page }) => {
        await page.goto(`${STORE}/de${path}`, { waitUntil: "networkidle" });
        // Scrolled to the product cards, where titles wrap differently by language.
        await page.evaluate((y) => window.scrollTo(0, y), phone ? 1500 : 300);
        if (phone) await page.locator("nav.fixed").getByRole("button", { name: "Konto" }).click();
        const scrollY = await page.evaluate(() => window.scrollY);
        const before = await frame(page);
        const requests: string[] = [];
        page.on("request", (r) => {
          if (r.resourceType() === "document" || r.resourceType() === "image") requests.push(r.url());
        });
        await watchShifts(page);

        for (const locale of ["fr", "it", "en"]) {
          const scope = phone ? page.getByRole("dialog") : page.locator("header");
          await scope.locator(`a[hreflang=${locale}]`).click();
          await expect(page).toHaveURL(new RegExp(`/${locale}${path}(#account)?$`));
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await page.waitForLoadState("networkidle");
          expect(await frame(page), locale).toEqual(before.map((b) => expect.objectContaining({ ...b, x: b.x })));
          expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY), locale).toBeLessThanOrEqual(5);
        }
        expect(await shifts(page)).toBeLessThan(0.01);
        expect(requests).toEqual([]);
      });
    }
  });
}

test.describe("the store name in the header", () => {
  test("on the home page: back to the very top, focus at the page start", async ({ page }) => {
    await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.locator("header").getByRole("link", { name: "The stores" }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page).toHaveURL(new RegExp(`${STORE}/de$`));
    await expect(page.locator("main")).toBeFocused();
  });

  test("from a product: the home page of this language, at the top", async ({ page }) => {
    await page.goto(`${STORE}/fr/p/windjacke-ridge`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.locator("header").getByRole("link", { name: "The stores" }).click();
    await expect(page).toHaveURL(new RegExp(`${STORE}/fr$`));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("main")).toBeFocused();
  });

  test("closes an open account menu", async ({ page }) => {
    await page.goto(`${STORE}/de#account`, { waitUntil: "networkidle" });
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.evaluate(() => (document.querySelector("header a") as HTMLElement).click());
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`${STORE}/de$`));
  });
});
