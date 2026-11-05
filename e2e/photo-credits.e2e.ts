import { expect, test } from "@playwright/test";

test("product photos come from Unsplash, credited «Foto: Name / Unsplash» with referral links", async ({ page }) => {
  await page.goto("/s/demo/de/p/leggings-flow", { waitUntil: "networkidle" });
  const photo = page.locator("main img").first();
  await expect(photo).toHaveAttribute("src", /images\.unsplash\.com/);
  expect(await photo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  const credit = page.locator("main p", { hasText: /^Foto: .+ \/ Unsplash/ }).first();
  await expect(credit).toBeVisible();
  for (const link of await credit.locator("a").all()) {
    await expect(link).toHaveAttribute("href", /[?&]utm_source=the_stores&utm_medium=referral$/);
  }
  await expect(credit.getByRole("link", { name: "Unsplash" }).first()).toHaveAttribute("href", /^https:\/\/unsplash\.com\//);
});
