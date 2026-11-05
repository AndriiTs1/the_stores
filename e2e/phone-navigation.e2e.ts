import { expect, test, type Page } from "@playwright/test";

const STORE = "/s/demo/de";
const bar = (page: Page) => page.locator("nav.fixed");

test("the tabs lead to their screens and mark themselves active", async ({ page }) => {
  await page.goto(STORE);
  const tabs = [
    { name: "Kategorien", url: /\/de\/categories$/, heading: "Kategorien" },
    { name: "Verkaufen", url: /\/de\/sell$/, heading: "Bald: Verkaufe deine Kleidung" },
    { name: "Merkliste", url: /\/de\/wishlist$/, heading: "Merkliste" },
    { name: "Start", url: /\/de$/, heading: null },
  ];
  for (const tab of tabs) {
    await bar(page).getByRole("link", { name: tab.name }).tap();
    await expect(page).toHaveURL(tab.url);
    await expect(bar(page).locator("a[aria-current=page]")).toHaveText(tab.name);
    if (tab.heading) await expect(page.getByRole("heading", { level: 1 })).toHaveText(tab.heading);
  }
});

test("wishlist: a heart adds, the tab counts, a second tap removes, empty state returns", async ({ page }) => {
  await page.goto(`${STORE}/wishlist`);
  await expect(page.getByText("Noch nichts gemerkt")).toBeVisible();

  await page.goto(STORE);
  await page.getByRole("button", { name: "Auf die Merkliste" }).first().tap();
  await expect(bar(page).getByRole("link", { name: "Merkliste, 1" })).toBeVisible();

  await bar(page).getByRole("link", { name: "Merkliste, 1" }).tap();
  await expect(page.locator("main a[href*='/p/']")).toHaveCount(1);
  await page.getByRole("button", { name: "Von der Merkliste entfernen" }).tap();
  await expect(page.getByText("Noch nichts gemerkt")).toBeVisible();
});

test("account panel: opens, switches to French and stays open, Esc closes and returns focus", async ({ page }) => {
  await page.goto(STORE);
  const account = bar(page).getByRole("button", { name: "Konto" });
  await account.tap();
  const panel = page.getByRole("dialog", { name: "Konto" });
  await expect(panel).toBeVisible();
  await expect(account).toHaveAttribute("aria-expanded", "true");
  await expect(panel).toBeFocused(); // the panel itself, not the cross (a tap must not show a ring)

  await panel.getByRole("link", { name: "Français" }).tap();
  await expect(page).toHaveURL(/\/s\/demo\/fr#account$/);
  const panelFr = page.getByRole("dialog", { name: "Compte" });
  await expect(panelFr).toBeVisible();
  await expect(panelFr.getByText("Ma commande")).toBeVisible();
  await expect(panelFr.getByRole("link", { name: "Français" })).toHaveAttribute("aria-current", "true");

  await page.keyboard.press("Escape");
  await expect(panelFr).toBeHidden();
  await expect(page).toHaveURL(/\/s\/demo\/fr$/);
  await expect(bar(page).getByRole("button", { name: "Compte" })).toBeFocused();
});

test("account panel: the dim layer and the back gesture close it; Tab stays inside", async ({ page }) => {
  await page.goto(STORE);
  const account = bar(page).getByRole("button", { name: "Konto" });
  await account.tap();
  const panel = page.getByRole("dialog", { name: "Konto" });
  await expect(panel).toBeVisible();
  for (let i = 0; i < 15; i++) await page.keyboard.press("Tab");
  expect(await panel.evaluate((p) => p.contains(document.activeElement))).toBe(true);

  await page.mouse.click(20, 400); // the dimmed page left of the panel
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/s\/demo\/de$/);

  await account.tap();
  await expect(panel).toBeVisible();
  await page.goBack();
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/s\/demo\/de$/);
});

test("/account as an address shows the same menu as a page", async ({ page }) => {
  await page.goto(`${STORE}/account`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Konto");
  await expect(page.getByRole("main").getByRole("link", { name: "Rückgabe" })).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Français" }).tap();
  await expect(page).toHaveURL(/\/fr\/account$/);
});

/** Outline of the focused element ("none" when there is none). */
const focusOutline = (page: Page) =>
  page.evaluate(() => {
    const c = getComputedStyle(document.activeElement as Element);
    return c.outlineStyle === "none" ? "none" : `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`;
  });

test("account panel opened by a tap: no focus ring on the cross or anywhere", async ({ page }) => {
  await page.goto(STORE);
  await bar(page).getByRole("button", { name: "Konto" }).tap();
  const panel = page.getByRole("dialog", { name: "Konto" });
  await expect(panel).toBeFocused();
  expect(await focusOutline(page)).toBe("none");
  const cross = panel.getByRole("button", { name: "Schliessen" });
  expect(await cross.evaluate((b) => getComputedStyle(b).outlineStyle)).toBe("none");
});

test("a link in the panel closes it and opens the page; Back returns home without the menu", async ({ page }) => {
  await page.goto(STORE);
  await bar(page).getByRole("button", { name: "Konto" }).tap();
  const panel = page.getByRole("dialog", { name: "Konto" });
  await panel.getByRole("link", { name: "Rückgabe" }).tap();
  await expect(page).toHaveURL(/\/s\/demo\/de\/info\/rueckgabe$/); // no #account
  await expect(panel).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rückgabe");
  await expect(page.locator("main")).toBeFocused(); // focus starts at the new page, not on the Account button
  expect(await focusOutline(page)).toBe("none");

  await page.goBack();
  await expect(page).toHaveURL(/\/s\/demo\/de$/);
  await expect(panel).toBeHidden();
});

test("account panel items: a tap shows no ring, Tab shows the grey one", async ({ page }) => {
  await page.goto("/s/demo/it");
  await bar(page).getByRole("button", { name: "Account" }).tap();
  const panel = page.getByRole("dialog", { name: "Account" });
  const item = panel.getByRole("link", { name: "Reso" });
  await item.dispatchEvent("pointerdown"); // press without releasing: the state right after the touch starts
  expect(await focusOutline(page)).toBe("none");

  await panel.focus();
  const rings = new Set<string>();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    rings.add(await focusOutline(page));
  }
  expect([...rings]).toEqual(["solid 2px rgb(94, 94, 94)"]);
});

test("bar labels: line height at least 1.3, nothing cut off in any language at 390 and 360 px", async ({ page }) => {
  for (const [width, locale] of [390, 360].flatMap((w) => ["de", "fr", "it", "en"].map((l) => [w, l] as const))) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/s/demo/${locale}`);
    const labels = await bar(page)
      .locator("span.truncate")
      .evaluateAll((spans) =>
        spans.map((s) => {
          const c = getComputedStyle(s);
          return {
            text: s.textContent,
            ratio: parseFloat(c.lineHeight) / parseFloat(c.fontSize),
            cut: s.scrollWidth > s.clientWidth,
          };
        }),
      );
    for (const l of labels) {
      expect(l.ratio, `${width} ${locale} ${l.text}`).toBeGreaterThanOrEqual(1.3 - 0.001);
      expect(l.cut, `${width} ${locale} ${l.text}`).toBe(false);
    }
  }
});

test("the raised Sell button opens the placeholder, marked active; nothing to fill in, not indexed", async ({
  page,
}) => {
  await page.goto(STORE);
  await expect(page.getByText("Gut zu wissen")).toHaveCount(0); // no shipping block on the home page
  await expect(page.locator("main")).not.toContainText("Versand");

  const sell = bar(page).getByRole("link", { name: "Artikel verkaufen" });
  await expect(bar(page).locator("li")).toHaveText(["Start", "Kategorien", "Verkaufen", "Merkliste", "Konto"]);
  await sell.tap();
  await expect(page).toHaveURL(/\/s\/demo\/de\/sell$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bald: Verkaufe deine Kleidung");
  await expect(page.getByText("Diese Funktion ist in Vorbereitung.")).toBeVisible();
  await expect(sell).toHaveAttribute("aria-current", "page");
  await expect(sell.locator("span.truncate")).toHaveCSS("color", "rgb(200, 16, 46)");
  await expect(page.locator("main form, main input, main textarea, main select")).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  await page.getByRole("link", { name: "Zurück zum Shop" }).tap();
  await expect(page).toHaveURL(/\/s\/demo\/de$/);
});

test("the Sell button and its page in every language", async ({ page }) => {
  const names = {
    fr: ["Vendre un article", "Bientôt\u00a0: vends tes vêtements"],
    it: ["Vendi un articolo", "Presto: vendi i tuoi vestiti"],
    en: ["Sell an item", "Coming soon: sell your clothes"],
  };
  for (const [locale, [label, title]] of Object.entries(names)) {
    await page.goto(`/s/demo/${locale}`);
    await bar(page).getByRole("link", { name: label }).tap();
    await expect(page).toHaveURL(new RegExp(`/${locale}/sell$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 }, hasTouch: false });

  test("the header Sell button sits left of the heart and leads to the placeholder", async ({ page }) => {
    await page.goto(STORE);
    await expect(page.locator("main")).not.toContainText("Versand");
    const sell = page.locator("header").getByRole("link", { name: "Artikel verkaufen" });
    const heart = page.locator("header").getByRole("link", { name: "Merkliste" });
    const [s, h] = [await sell.boundingBox(), await heart.boundingBox()];
    expect(s!.height).toBe(40);
    expect(s!.x + s!.width).toBeLessThan(h!.x);
    await expect(sell).toHaveText("Verkaufen");
    await sell.click();
    await expect(page).toHaveURL(/\/s\/demo\/de\/sell$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bald: Verkaufe deine Kleidung");
  });
});
