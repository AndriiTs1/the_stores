import { expect, test } from "@playwright/test";

/** Runs as an iPhone in WebKit and in Chromium at 360px (playwright.config.ts). */
const STORE = "/s/demo";

const docWidth = (page: import("@playwright/test").Page) =>
  page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, screen: window.innerWidth }));

for (const locale of ["de", "fr", "it", "en"]) {
  test(`${locale}: search field text is 16px, focus changes neither the field nor the page width`, async ({ page }) => {
    await page.goto(`${STORE}/${locale}`, { waitUntil: "networkidle" });
    const search = page.getByRole("searchbox");
    const before = { box: await search.boundingBox(), doc: await docWidth(page) };
    await search.tap();
    await expect(search).toBeFocused();
    expect(parseFloat(await search.evaluate((e) => getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await search.boundingBox()).toEqual(before.box);
    expect(await docWidth(page)).toEqual(before.doc);
  });
}

test("every field on the product, cart and checkout pages is at least 16px", async ({ page }) => {
  await page.goto(`${STORE}/de/p/windjacke-ridge`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /In den Warenkorb/ }).tap();
  await expect(page.getByRole("link", { name: /Warenkorb, 1 Artikel/ })).toBeVisible();
  for (const path of ["/p/windjacke-ridge", "/cart", "/checkout"]) {
    await page.goto(`${STORE}/de${path}`, { waitUntil: "networkidle" });
    const sizes = await page
      .locator('input:not([type="hidden"]), select, textarea')
      .evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).fontSize)));
    expect(sizes.length, path).toBeGreaterThan(0);
    for (const size of sizes) expect(size, path).toBeGreaterThanOrEqual(16);
  }
});

const PAGES = [
  "",
  "/categories",
  "/collections/herren",
  "/p/windjacke-ridge",
  "/wishlist",
  "/sell",
  "/cart",
  "/checkout",
  ...["hilfe", "versand", "rueckgabe", "ueber-uns", "agb", "datenschutz", "impressum"].map((p) => `/info/${p}`),
];

/**
 * Elements that reach past the screen edge where you can see them: a part cut off by an ancestor with overflow
 * hidden or clip (the closed account panel waiting off-screen) doesn't count. Listed for the failure message.
 */
const sticksOut = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) return false;
        let { left, right } = rect;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          if (getComputedStyle(a).overflowX === "visible") continue;
          const box = a.getBoundingClientRect();
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        return right > left && (right > window.innerWidth + 0.5 || left < -0.5);
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${el.getAttribute("class")}`),
  );

for (const locale of ["de", "fr", "it", "en"]) {
  test(`${locale}: no page is wider than the screen, with the account menu closed or open`, async ({ page }) => {
    test.setTimeout(120_000);
    // Something in the cart and on the wishlist, so those pages show content, not their empty state.
    await page.goto(`${STORE}/${locale}/p/windjacke-ridge`, { waitUntil: "networkidle" });
    await page.locator("main button[aria-pressed]").first().tap();
    await page.locator("main form button.btn-accent").tap();
    await page.waitForURL(/\/cart$/);

    for (const path of PAGES) {
      for (const hash of ["", "#account"]) {
        await page.goto(`${STORE}/${locale}${path}${hash}`, { waitUntil: "networkidle" });
        if (hash) await expect(page.getByRole("dialog")).toBeVisible();
        const { scroll, screen } = await docWidth(page);
        expect(scroll, `${path}${hash}`).toBeLessThanOrEqual(screen);
        expect(await sticksOut(page), `${path}${hash}`).toEqual([]);
      }
    }
  });
}

test("the header stays at the top while the page scrolls", async ({ page }) => {
  await page.goto(`${STORE}/de`, { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  expect((await page.locator("header").first().boundingBox())?.y).toBe(0);
});
