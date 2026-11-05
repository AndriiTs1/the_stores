import { expect, test } from "@playwright/test";

const STORE = "/s/demo/de";
const DARK = "rgb(17, 17, 17)";

/**
 * Underline of the text one sees in a link: its visible label span (a translated label is an inline grid of every
 * translation, StableText), else the link itself.
 */
const visibleUnderline = (link: import("@playwright/test").Locator) =>
  link.evaluate((a) => {
    const spans = [...a.querySelectorAll("span")].filter((s) => getComputedStyle(s).visibility !== "hidden" && !s.children.length);
    const el = spans[0] ?? a;
    const c = getComputedStyle(el);
    return { line: c.textDecorationLine, thickness: c.textDecorationThickness, color: c.textDecorationColor };
  });

test.describe("phone: Start and the store name lead to the top", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test("on the home page, Start scrolls back to the top without leaving the page", async ({ page }) => {
    await page.goto(`${STORE}?line=new`, { waitUntil: "networkidle" }); // long enough to scroll
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const requests: string[] = [];
    page.on("request", (r) => r.resourceType() === "fetch" && r.url().includes("_rsc") && requests.push(r.url()));
    await page.locator("nav.fixed").getByRole("link", { name: "Start" }).tap();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page).toHaveURL(new RegExp(`${STORE}\\?line=new$`)); // the part of the store stays
    expect(requests).toEqual([]); // no navigation
  });

  test("from a product, Start opens the home page at the top", async ({ page }) => {
    await page.goto(`${STORE}/p/windjacke-ridge`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.locator("nav.fixed").getByRole("link", { name: "Start" }).tap();
    await expect(page).toHaveURL(new RegExp(`${STORE}$`));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("the store name on the home page scrolls up as well", async ({ page }) => {
    await page.goto(`${STORE}?line=new`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.locator("header").getByRole("link", { name: "The stores" }).tap();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("desktop menu", () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  const menu = (page: import("@playwright/test").Page) => page.locator("header nav[aria-label]");

  test("on /collections/sport, Sport is current: dark, semibold, 2px underline, not red", async ({ page }) => {
    await page.goto(`${STORE}/collections/sport`, { waitUntil: "networkidle" });
    const sport = menu(page).getByRole("link", { name: "Sport" });
    await expect(sport).toHaveAttribute("aria-current", "page");
    await expect(sport).toHaveCSS("color", DARK);
    await expect(sport).toHaveCSS("font-weight", "600");
    expect(await visibleUnderline(sport)).toEqual({ line: "underline", thickness: "2px", color: DARK });
    // No red in the menu (Sale became the Outlet part of the store).
    const colors = await menu(page).getByRole("link").evaluateAll((ls) => ls.map((l) => getComputedStyle(l).color));
    expect(colors.every((c) => c === "rgb(17, 17, 17)")).toBe(true);
  });

  test("on /collections/herren, Herren (a translated label) is underlined too", async ({ page }) => {
    await page.goto(`${STORE}/collections/herren`, { waitUntil: "networkidle" });
    const herren = menu(page).getByRole("link", { name: "Herren" });
    await expect(herren).toHaveAttribute("aria-current", "page");
    expect(await visibleUnderline(herren)).toEqual({ line: "underline", thickness: "2px", color: DARK });
  });
});
