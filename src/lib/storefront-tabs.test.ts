import { describe, expect, it } from "vitest";
import { activeTab, storePath, tabHref, TABS } from "./storefront-tabs";

describe("activeTab", () => {
  it("each of the four tabs is active on its own screen", () => {
    expect(activeTab("/de", "de")).toBe("start");
    expect(activeTab("/de/categories", "de")).toBe("categories");
    expect(activeTab("/de/wishlist", "de")).toBe("wishlist");
    expect(activeTab("/de/account", "de")).toBe("account");
  });

  it("pages reached from a tab keep it active", () => {
    expect(activeTab("/fr/p/hoodie-hilltop", "fr")).toBe("start");
    expect(activeTab("/fr/collections/herren", "fr")).toBe("categories");
    expect(activeTab("/fr/categories/t-shirts", "fr")).toBe("categories");
    expect(activeTab("/fr/brands/muster-sport", "fr")).toBe("categories");
    expect(activeTab("/fr/sale", "fr")).toBe("categories");
    expect(activeTab("/fr/info/impressum", "fr")).toBe("account");
    expect(activeTab("/de/", "de")).toBe("start");
  });

  it("search, cart, checkout and other languages' paths belong to no tab", () => {
    expect(activeTab("/de/search", "de")).toBeNull();
    expect(activeTab("/de/cart", "de")).toBeNull();
    expect(activeTab("/de/checkout", "de")).toBeNull();
    expect(activeTab("/en/categories", "de")).toBeNull();
    expect(activeTab("/de-luxe", "de")).toBeNull();
  });
});

describe("tabHref + storePath: moving between the four tabs", () => {
  it("every tab's link leads back to that tab, opened by path or on the store's own domain", () => {
    for (const base of ["/s/demo", ""]) {
      for (const tab of TABS) {
        const href = tabHref(tab, base, "it");
        expect(activeTab(storePath(href, base), "it")).toBe(tab);
      }
    }
  });

  it("strips the store prefix, also when the proxy rewrote a custom domain to /s/<host>", () => {
    expect(storePath("/s/demo/de/cart", "/s/demo")).toBe("/de/cart");
    expect(storePath("/de/cart", "")).toBe("/de/cart");
    expect(storePath("/s/shop.example.ch/de/cart", "")).toBe("/de/cart");
  });
});
