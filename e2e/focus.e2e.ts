import { expect, test, type Page } from "@playwright/test";

/** Outline of the focused element, and whether it sits on the black message bar (which uses a white outline). */
const focused = (page: Page) =>
  page.evaluate(() => {
    const e = document.activeElement as HTMLElement;
    const c = getComputedStyle(e);
    return {
      tag: e.tagName,
      field: e.classList.contains("input"),
      onBar: !!e.closest(".bg-foreground"),
      outline: c.outlineStyle === "none" ? "none" : `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} ${c.outlineOffset}`,
    };
  });

const GREY = "solid 2px rgb(94, 94, 94) 2px";
const WHITE = "solid 2px rgb(255, 255, 255) 2px";

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
]) {
  test(`keyboard focus is a 2px grey outline on every link and button (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/s/demo/de");
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const f = await focused(page);
      if (f.field) continue; // input fields show focus with their border and halo instead
      expect(f.outline, `${f.tag} #${i}`).toBe(f.onBar ? WHITE : GREY);
    }
  });

  test(`a click or tap shows no outline (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/s/demo/de/categories");
    await page.locator("header a").first().click(); // the logo
    await expect(page).toHaveURL(/\/de$/);
    expect((await focused(page)).outline).toBe("none");
    const heart = page.getByRole("button", { name: "Auf die Merkliste" }).first();
    await heart.click();
    expect((await focused(page)).outline).toBe("none");
    await heart.click();
  });
}

test("product page: size buttons get the grey outline at once (no colour transition on the outline)", async ({ page }) => {
  await page.goto("/s/demo/de/p/t-shirt-classic");
  const size = page.getByRole("button", { name: "M", exact: true });
  await size.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect((await focused(page)).outline).toBe(GREY);
});
