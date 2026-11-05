import { expect, test } from "@playwright/test";

const TEXTS = {
  de: { bar: "Kollektion Herbst / Winter 2026", title: "Die Kollektion", section: "Unsere Auswahl" },
  fr: { bar: "Collection automne / hiver 2026", title: "La collection", section: "Notre sélection" },
  it: { bar: "Collezione autunno / inverno 2026", title: "La collezione", section: "La nostra selezione" },
  en: { bar: "Autumn / Winter 2026 collection", title: "The collection", section: "Our selection" },
};
const NEW_WORDS = /\b(Neu|Neue|Neuheiten|Nouveau|Nouveautés|Nouvelle|Novità|Nuova|New|New in)\b/;

for (const width of [390, 1440]) {
  test(`home (${width}px): collection texts, no "new" anywhere, discount labels from prices`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const [locale, t] of Object.entries(TEXTS)) {
      await page.goto(`/s/demo/${locale}`);
      await expect(page.getByRole("link", { name: t.bar })).toBeVisible();
      await expect(page.getByRole("heading", { name: t.title })).toBeVisible();
      await expect(page.getByRole("heading", { name: t.section })).toBeVisible();
      expect(await page.locator("body").innerText()).not.toMatch(NEW_WORDS);

      // Windjacke Ridge: 149.90 → 129.90 = −13 %; a card without an old price has no label.
      const ridge = page.locator("main li").filter({ has: page.locator("a[href$='/p/windjacke-ridge']") });
      await expect(ridge.locator("span.bg-accent")).toHaveText("−13%");
      const classic = page.locator("main li").filter({ has: page.locator("a[href$='/p/t-shirt-classic']") });
      await expect(classic.locator("span.bg-accent")).toHaveCount(0);
    }
  });
}

test("product page shows the same discount label; the wishlist's empty state links to the selection", async ({
  page,
}) => {
  await page.goto("/s/demo/de/p/windjacke-ridge");
  await expect(page.locator("form").getByText("−13%")).toBeVisible();
  await page.goto("/s/demo/de/wishlist");
  await page.getByRole("link", { name: "Unsere Auswahl" }).tap();
  await expect(page).toHaveURL(/\/s\/demo\/de#selection$/);
});
