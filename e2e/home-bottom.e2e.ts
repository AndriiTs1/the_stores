import { expect, test } from "@playwright/test";

test("demo home: no brands section (its brands have no logos), in any language", async ({ page }) => {
  for (const [locale, heading] of [["de", "Marken"], ["fr", "Marques"], ["it", "Marche"], ["en", "Brands"]]) {
    await page.goto(`/s/demo/${locale}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: heading, exact: true })).toHaveCount(0);
    await expect(page.locator("section[aria-labelledby=brands]")).toHaveCount(0);
  }
});

test.describe("360px", () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test("category pills on the home page stay in one row that scrolls, 40px high, 16px from the edge", async ({ page }) => {
    for (const locale of ["de", "fr", "it", "en"]) {
      await page.goto(`/s/demo/${locale}`, { waitUntil: "networkidle" });
      const pills = page.locator("section[aria-labelledby=categories] a");
      const tops = await pills.evaluateAll((ls) => ls.map((l) => (l as HTMLElement).offsetTop));
      expect(tops.length, locale).toBeGreaterThan(1);
      expect(new Set(tops).size, locale).toBe(1);
      const first = (await pills.first().boundingBox())!;
      expect([Math.round(first.x), Math.round(first.height)], locale).toEqual([16, 40]);
      const row = page.locator("section[aria-labelledby=categories] ul");
      expect(await row.evaluate((ul) => ul.scrollWidth > ul.clientWidth), locale).toBe(true);
    }
  });
});
