import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const meta = (page: Page, key: string) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute("content");

/** Width and height from a PNG header. */
async function pngSize(request: APIRequestContext, url: string) {
  const res = await request.get(url);
  expect(res.status(), url).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const png = await res.body();
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

for (const [path, locale, title] of [
  ["/s/demo/de", "de_CH", "The stores"],
  ["/s/demo/it", "it_CH", "The stores"],
  ["/s/demo/de/p/windjacke-ridge", "de_CH", "Windjacke Ridge · The stores"],
]) {
  test(`${path}: link preview 1200×630 at an absolute address`, async ({ page, request }) => {
    await page.goto(path);
    expect(await meta(page, "og:title")).toBe(title);
    expect(await meta(page, "og:description")).toBeTruthy();
    expect(await meta(page, "og:locale")).toBe(locale);
    expect(await meta(page, "twitter:card")).toBe("summary_large_image");
    const image = (await meta(page, "og:image"))!;
    expect(image).toMatch(/^https?:\/\/[^/]+\/s\/demo\//);
    expect(image).toContain(path.includes("/p/") ? "/p/windjacke-ridge/opengraph-image" : "/opengraph-image");
    expect(await pngSize(request, image)).toEqual({ width: 1200, height: 630 });
  });
}

test("store icons: 32, 192 and 512 px, apple-touch-icon 180 px, no Next.js favicon", async ({ page, request }) => {
  await page.goto("/s/demo/de");
  const icons = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((l) => [l.getAttribute("rel"), l.getAttribute("sizes"), l.getAttribute("href")]));
  expect(icons.map(([rel, sizes]) => `${rel} ${sizes}`)).toEqual([
    "icon 32x32",
    "icon 192x192",
    "icon 512x512",
    "apple-touch-icon 180x180",
  ]);
  for (const [, sizes, href] of icons) {
    const px = Number(sizes!.split("x")[0]);
    expect(await pngSize(request, href!)).toEqual({ width: px, height: px });
  }
  expect((await request.get("/favicon.ico")).status()).toBe(404);
});
