import { describe, expect, it } from "vitest";
import {
  filterCount,
  filtersQuery,
  filterWhere,
  listingHref,
  matchesFilters,
  NO_FILTERS,
  parseFilters,
  sortProducts,
  sortSizes,
  type ProductFacet,
} from "./filters";

describe("parseFilters", () => {
  it("reads every filter from the query", () => {
    expect(
      parseFilters({
        size: "M,L",
        min: "20",
        max: "99.90",
        sale: "1",
        brand: "muster-sport,muster-basics",
        color: "Schwarz,Grün",
        sort: "price_asc",
        page: "2",
      }),
    ).toEqual({
      sizes: ["M", "L"],
      min: 2000,
      max: 9990,
      sale: true,
      brands: ["muster-sport", "muster-basics"],
      colors: ["Schwarz", "Grün"],
      sort: "price_asc",
      page: 2,
    });
  });

  it("empty or missing values give no filters", () => {
    expect(parseFilters({})).toEqual(NO_FILTERS);
    expect(parseFilters({ size: "", min: "", max: " ", sale: "", brand: ",", sort: "", page: "" })).toEqual(NO_FILTERS);
  });

  it("wrong values are ignored silently", () => {
    expect(
      parseFilters({
        size: "M,<script>,L,M",
        min: "-5",
        max: "abc",
        sale: "yes",
        brand: "Muster Sport,ok-brand",
        color: "Rot;drop table",
        sort: "cheapest",
        page: "-3",
      }),
    ).toEqual({ ...NO_FILTERS, sizes: ["M", "L"], brands: ["ok-brand"] });
    expect(parseFilters({ min: "1e9", max: "12.345", page: "999" })).toEqual({ ...NO_FILTERS, page: 20 });
  });

  it("a repeated parameter uses its first value; a reversed price range is turned round", () => {
    expect(parseFilters({ size: ["S", "XL"], min: "100", max: "20" })).toMatchObject({ sizes: ["S"], min: 2000, max: 10000 });
  });
});

describe("filtersQuery", () => {
  it("writes the chosen filters back, defaults left out, the page only for load more", () => {
    const f = parseFilters({ size: "M,L", min: "20", max: "99.9", sale: "1", sort: "newest", page: "3" });
    expect(filtersQuery(f)).toBe("?size=M,L&min=20&max=99.90&sale=1&sort=newest");
    expect(filtersQuery(f, { page: true })).toBe("?size=M,L&min=20&max=99.90&sale=1&sort=newest&page=3");
    expect(filtersQuery(NO_FILTERS)).toBe("");
  });

  it("round-trips through parseFilters", () => {
    const f = parseFilters({ size: "XS", color: "Grün", brand: "a-b", min: "5" });
    expect(parseFilters(Object.fromEntries(new URLSearchParams(filtersQuery(f))))).toEqual(f);
  });
});

it("filterCount: values chosen, a price range once", () => {
  expect(filterCount(parseFilters({ size: "M,L", min: "1", max: "9", sale: "1" }))).toBe(4);
  expect(filterCount(NO_FILTERS)).toBe(0);
});

it("sortSizes: letters in order, then numbers, only once each", () => {
  expect(sortSizes(["XL", "S", "164", "M", "116", "XXL", "XS", "L", "S", "One size"])).toEqual([
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "116",
    "164",
    "One size",
  ]);
});

describe("matchesFilters", () => {
  const p: ProductFacet = { id: "1", sizes: ["M", "L"], colors: ["Schwarz"], brand: "b", prices: [2990, 3490], sale: false };

  it("any value within a group, every group must match", () => {
    expect(matchesFilters(p, NO_FILTERS)).toBe(true);
    expect(matchesFilters(p, { ...NO_FILTERS, sizes: ["S", "M"] })).toBe(true);
    expect(matchesFilters(p, { ...NO_FILTERS, sizes: ["S"] })).toBe(false);
    expect(matchesFilters(p, { ...NO_FILTERS, sizes: ["M"], colors: ["Rot"] })).toBe(false);
    expect(matchesFilters(p, { ...NO_FILTERS, sale: true })).toBe(false);
    expect(matchesFilters(p, { ...NO_FILTERS, brands: ["b"] })).toBe(true);
  });

  it("price: any variant within the range", () => {
    expect(matchesFilters(p, { ...NO_FILTERS, min: 3000 })).toBe(true);
    expect(matchesFilters(p, { ...NO_FILTERS, max: 2990 })).toBe(true);
    expect(matchesFilters(p, { ...NO_FILTERS, min: 3000, max: 3400 })).toBe(false);
  });
});

it("filterWhere: nothing chosen → no condition; sizes need stock", () => {
  expect(filterWhere(NO_FILTERS)).toEqual({});
  const where = filterWhere({ ...NO_FILTERS, sizes: ["M"], sale: true });
  expect(JSON.stringify(where)).toContain('"inventory":{"some":{"quantity":{"gt":0},"location":{"sellsOnline":true}}}');
  expect(where.AND).toHaveLength(2);
});

describe("sortProducts", () => {
  const day = (n: number) => new Date(2026, 0, n);
  const items = [
    { id: "a", price: 3000, discount: 0, createdAt: day(1), isNew: false, soldOut: false },
    { id: "b", price: 1000, discount: 20, createdAt: day(2), isNew: false, soldOut: true },
    { id: "c", price: 2000, discount: 10, createdAt: day(3), isNew: false, soldOut: false },
    { id: "d", price: 5000, discount: 0, createdAt: day(0), isNew: true, soldOut: false },
  ];
  const ids = (sort: Parameters<typeof sortProducts>[1]) => sortProducts(items, sort).map((i) => i.id);

  it("each order, sold-out products last", () => {
    expect(ids("price_asc")).toEqual(["c", "a", "d", "b"]);
    expect(ids("price_desc")).toEqual(["d", "a", "c", "b"]);
    expect(ids("newest")).toEqual(["c", "a", "d", "b"]);
    expect(ids("discount")).toEqual(["c", "a", "d", "b"]);
    expect(ids("recommended")).toEqual(["d", "c", "a", "b"]);
  });
});

it("listingHref keeps the page's own query", () => {
  const f = { ...NO_FILTERS, sizes: ["M"] };
  expect(listingHref("/s/demo/de/sale", f)).toBe("/s/demo/de/sale?size=M");
  expect(listingHref("/s/demo/de/collections/herren?category=t-shirts", f)).toBe(
    "/s/demo/de/collections/herren?category=t-shirts&size=M",
  );
  expect(listingHref("/s/demo/de/sale", NO_FILTERS)).toBe("/s/demo/de/sale");
});
