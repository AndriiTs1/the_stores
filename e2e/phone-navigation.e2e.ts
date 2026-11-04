import { expect, test } from "@playwright/test";

const STORE = "/s/demo/de";
const bar = (page: import("@playwright/test").Page) => page.getByRole("navigation").filter({ has: page.locator("a[href$='/account']") });

test("the four tabs lead to their screens and mark themselves active", async ({ page }) => {
  await page.goto(STORE);
  const tabs = [
    { name: "Kategorien", url: /\/de\/categories$/, heading: "Kategorien" },
    { name: "Merkliste", url: /\/de\/wishlist$/, heading: "Merkliste" },
    { name: "Konto", url: /\/de\/account$/, heading: "Konto" },
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

test("changing the language on the account screen stays on it", async ({ page }) => {
  await page.goto(`${STORE}/account`);
  await page.getByRole("link", { name: "Français" }).tap();
  await expect(page).toHaveURL(/\/fr\/account$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Compte");
  await expect(page.getByRole("link", { name: "Français" })).toHaveAttribute("aria-current", "true");
});
