import { expect, test, type Page } from "@playwright/test";

const STORE = "/s/demo/de";
const bar = (page: Page) => page.locator("nav.fixed");

test("the tabs lead to their screens and mark themselves active", async ({ page }) => {
  await page.goto(STORE);
  const tabs = [
    { name: "Kategorien", url: /\/de\/categories$/, heading: "Kategorien" },
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
  await expect(panel.getByRole("button", { name: "Schliessen" })).toBeFocused();

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
