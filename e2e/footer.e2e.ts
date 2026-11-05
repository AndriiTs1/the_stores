import { expect, test } from "@playwright/test";

const LOCALES = ["de", "fr", "it", "en"];
const year = new Date().getFullYear();

test("phone footer: only the copyright line, no links, no VAT note or placeholder e-mail", async ({ page }) => {
  for (const locale of LOCALES) {
    await page.goto(`/s/demo/${locale}`);
    const footer = page.locator("footer");
    await expect(footer.getByRole("link")).toHaveCount(0); // hidden link groups are not in the accessibility tree
    await expect(footer).toHaveText(`© ${year} THE STORES`, { useInnerText: true });
    await expect(footer).not.toContainText(/IVA|MwSt|TVA|VAT|example\.ch/);
  }
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false });

  test("footer keeps the links, the bottom line is only the copyright", async ({ page }) => {
    for (const locale of LOCALES) {
      await page.goto(`/s/demo/${locale}`);
      const footer = page.locator("footer");
      await expect(footer.getByRole("navigation")).toHaveCount(2);
      await expect(footer.getByRole("link", { name: /Impressum|Mentions légales|Note legali|Legal notice/ })).toBeVisible();
      await expect(footer.locator("p")).toHaveText(`© ${year} THE STORES`, { useInnerText: true });
      await expect(footer).not.toContainText(/IVA|MwSt|TVA|VAT|example\.ch/);
    }
  });

  test("header heart leads to the wishlist and counts saved items", async ({ page }) => {
    await page.goto("/s/demo/de");
    await page.evaluate(() => localStorage.removeItem("merkliste:demo"));
    await page.reload();
    const heart = page.locator("header").getByRole("link", { name: /^Merkliste/ });
    await expect(heart).toHaveAccessibleName("Merkliste");
    await page.getByRole("button", { name: "Auf die Merkliste" }).first().click();
    await expect(heart).toHaveAccessibleName("Merkliste, 1");
    await heart.click();
    await expect(page).toHaveURL(/\/de\/wishlist$/);
    await expect(page.locator("main a[href*='/p/']")).toHaveCount(1);
    await page.evaluate(() => localStorage.removeItem("merkliste:demo"));
  });
});
