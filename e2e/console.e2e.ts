import { expect, test } from "@playwright/test";

/** Home, a category and a product open without errors or warnings in the browser console, in every language. */
for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`${viewport.width}px: a clean console on home, category and product`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    const messages: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") messages.push(`${m.type()} ${page.url()}: ${m.text()}`);
    });
    page.on("pageerror", (e) => messages.push(`pageerror ${page.url()}: ${e.message}`));
    for (const locale of ["de", "fr", "it", "en"]) {
      for (const path of ["", "/collections/herren", "/p/windjacke-ridge"]) {
        await page.goto(`/s/demo/${locale}${path}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(300); // LCP and hydration messages arrive after load
      }
    }
    expect(messages).toEqual([]);
  });
}
