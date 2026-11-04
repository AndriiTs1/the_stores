import { describe, expect, it, vi } from "vitest";
import { itemLimit, MAX_ITEMS, moreHref, PAGE_SIZE, searchQuery, toProductCard } from "./catalog";

// Pure functions only: no database client.
vi.mock("./db", () => ({ db: {} }));

type Row = Parameters<typeof toProductCard>[0];

const variant = (id: string, options: Record<string, string>, price: number, qty: number, compareAtPrice: number | null = null) =>
  ({
    id,
    options,
    price,
    compareAtPrice,
    inventory: [{ quantity: qty, location: { sellsOnline: true } }],
  }) as unknown as Row["variants"][number];

const product = (over: Partial<Row>): Row =>
  ({
    id: "p1",
    slug: "hoodie",
    title: { de: "Hoodie", fr: "Sweat" },
    images: ["/a.svg", "/b.svg", "/c.svg"],
    optionNames: ["size", "color"],
    optionValues: null,
    isNew: false,
    brand: { name: "Muster Basics" },
    variants: [],
    ...over,
  }) as Row;

describe("toProductCard", () => {
  it("sizes in variant order, sold out only when no colour has stock", () => {
    const card = toProductCard(
      product({
        variants: [
          variant("1", { size: "S", color: "Schwarz" }, 8990, 0),
          variant("2", { size: "M", color: "Schwarz" }, 8990, 2),
          variant("3", { size: "L", color: "Schwarz" }, 8990, 0),
          variant("4", { size: "S", color: "Grau" }, 8990, 0),
          variant("5", { size: "M", color: "Grau" }, 8990, 0),
          variant("6", { size: "L", color: "Grau" }, 8990, 1),
        ],
      }),
      "fr",
    );
    expect(card.sizes).toEqual([
      { label: "S", soldOut: true },
      { label: "M", soldOut: false },
      { label: "L", soldOut: false },
    ]);
    expect(card.soldOut).toBe(false);
    expect(card.title).toBe("Sweat");
    expect(card.brand).toBe("Muster Basics");
    expect(card.images).toEqual(["/a.svg", "/b.svg"]);
  });

  it("lowest price with that variant's compare-at price", () => {
    const card = toProductCard(
      product({
        variants: [variant("1", { size: "S" }, 9990, 1), variant("2", { size: "M" }, 7990, 1, 9990)],
      }),
      "de",
    );
    expect(card.price).toBe(7990);
    expect(card.compareAt).toBe(9990);
  });

  it("no size option → no sizes; nothing in stock → sold out", () => {
    const card = toProductCard(
      product({ optionNames: ["color"], brand: null, variants: [variant("1", { color: "Rot" }, 2490, 0)] }),
      "de",
    );
    expect(card.sizes).toEqual([]);
    expect(card.soldOut).toBe(true);
    expect(card.brand).toBeNull();
  });

  it("the store's \"new\" flag reaches the card", () => {
    expect(toProductCard(product({ isNew: true }), "de").isNew).toBe(true);
    expect(toProductCard(product({}), "de").isNew).toBe(false);
  });

  it("size labels use the product's translations", () => {
    const card = toProductCard(
      product({
        optionValues: { size: { "Einheitsgrösse": { fr: "Taille unique" } } },
        variants: [variant("1", { size: "Einheitsgrösse" }, 2490, 3)],
      }),
      "fr",
    );
    expect(card.sizes).toEqual([{ label: "Taille unique", soldOut: false }]);
  });
});

describe("itemLimit", () => {
  it("one page by default and for anything odd", () => {
    for (const v of [undefined, "", "abc", "0", "-5", "12", ["24"]]) expect(itemLimit(v)).toBe(PAGE_SIZE);
  });
  it("rounds up to whole pages and caps", () => {
    expect(itemLimit("24")).toBe(24);
    expect(itemLimit("13")).toBe(24);
    expect(itemLimit("100000")).toBe(MAX_ITEMS);
  });
});

describe("moreHref", () => {
  it("next page, other params kept and encoded", () => {
    expect(moreHref("/s/demo/de", 12)).toBe("/s/demo/de?n=24");
    expect(moreHref("/de/search", 24, { q: "t-shirt & co" })).toBe("/de/search?q=t-shirt+%26+co&n=36");
  });
});

describe("searchQuery", () => {
  it("trims, caps at 100 characters, ignores non-strings", () => {
    expect(searchQuery("  hoodie ")).toBe("hoodie");
    expect(searchQuery("x".repeat(150))).toHaveLength(100);
    expect(searchQuery(undefined)).toBe("");
    expect(searchQuery(["a", "b"])).toBe("");
  });
});
