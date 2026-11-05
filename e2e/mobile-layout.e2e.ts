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
