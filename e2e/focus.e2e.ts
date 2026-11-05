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
      outline:
        c.outlineStyle === "none" ? "none" : `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} ${c.outlineOffset}`,
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
    await page.goto("/s/demo/de", { waitUntil: "networkidle" }); // Tab only once the page is hydrated
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

test("product page: size buttons get the grey outline at once (no colour transition on the outline)", async ({
  page,
}) => {
  await page.goto("/s/demo/de/p/t-shirt-classic");
  const size = page.getByRole("button", { name: "M", exact: true });
  await size.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  expect((await focused(page)).outline).toBe(GREY);
});

test.describe("logo on a touch phone (Chrome device mode)", () => {
  test.use({ viewport: { width: 390, height: 652 }, hasTouch: true, isMobile: true });

  /** After a scenario: even a key press (Esc, Shift — which make an already focused element :focus-visible) leaves the logo without a ring. */
  const expectNoLogoRing = async (page: Page, step: string) => {
    for (const key of ["Escape", "Shift"]) await page.keyboard.press(key);
    const logo = page.locator("header a").first();
    expect(await logo.evaluate((a) => getComputedStyle(a).outlineStyle), step).toBe("none");
  };

  test("no ring after load, tapping the logo, closing the account menu, going back", async ({ page }) => {
    const logo = page.locator("header a").first();
    // networkidle: hydrated. Before that the logo is a plain link and a tap reloads the page (focus starts afresh).
    await page.goto("/s/demo/it", { waitUntil: "networkidle" });
    await expectNoLogoRing(page, "load");

    await logo.tap(); // the page already open
    await expect(page.locator("main")).toBeFocused();
    await expectNoLogoRing(page, "tap on home");

    await page.goto("/s/demo/it/categories", { waitUntil: "networkidle" });
    await logo.tap();
    await expect(page).toHaveURL(/\/s\/demo\/it$/);
    await expectNoLogoRing(page, "tap from another page");

    const bar = page.locator("nav.fixed");
    await bar.getByRole("button", { name: "Account" }).tap();
    await page.getByRole("dialog").getByRole("button", { name: "Chiudi" }).tap();
    await expectNoLogoRing(page, "close menu by the cross");
    await bar.getByRole("button", { name: "Account" }).tap();
    await page.getByRole("dialog").getByRole("link", { name: "Reso" }).tap();
    await expect(page).toHaveURL(/\/info\/rueckgabe$/);
    await expectNoLogoRing(page, "leave menu by a link");

    await page.goBack();
    await expect(page).toHaveURL(/\/s\/demo\/it$/);
    await expectNoLogoRing(page, "back");
  });

  test("Tab still shows the grey ring, hugging the logo text", async ({ page }) => {
    await page.goto("/s/demo/it");
    const logo = page.locator("header a").first();
    await logo.focus();
    await page.keyboard.press("Shift"); // a key press: keyboard focus
    expect(await logo.evaluate((a) => getComputedStyle(a).outline)).toBe("rgb(94, 94, 94) solid 2px");
    const width = await logo.evaluate((a) => a.getBoundingClientRect().width);
    const text = await logo.evaluate((a) => {
      const r = document.createRange();
      r.selectNodeContents(a);
      return r.getBoundingClientRect().width;
    });
    expect(width).toBeLessThanOrEqual(text + 1);
  });
});
