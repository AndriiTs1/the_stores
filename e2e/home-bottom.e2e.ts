import { expect, test } from "@playwright/test";

test("demo home: no brands section (its brands have no logos), in any language", async ({ page }) => {
  for (const [locale, heading] of [["de", "Marken"], ["fr", "Marques"], ["it", "Marche"], ["en", "Brands"]]) {
    await page.goto(`/s/demo/${locale}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: heading, exact: true })).toHaveCount(0);
    await expect(page.locator("section[aria-labelledby=brands]")).toHaveCount(0);
  }
});
