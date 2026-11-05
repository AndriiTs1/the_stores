import type { Prisma } from "@/generated/prisma/client";

/**
 * Filters and sorting of a product listing (category, collection, brand, sale, all products), carried in the query:
 * ?size=M,L&min=20&max=100&sale=1&brand=muster-sport&color=Schwarz&sort=price_asc&page=2
 * Pure functions, shared by the server (Prisma filtering) and the filter sheet (its live count).
 */

export const SORTS = ["recommended", "price_asc", "price_desc", "newest", "discount"] as const;
export type Sort = (typeof SORTS)[number];

/** Products per "load more" step. */
export const LISTING_PAGE = 24;
const MAX_PAGE = 20;

export type Filters = {
  sizes: string[];
  /** Price bounds in Rappen (the query has CHF). */
  min: number | null;
  max: number | null;
  sale: boolean;
  /** Brand slugs. */
  brands: string[];
  /** Colour values as stored on the variants (German, e.g. "Schwarz"). */
  colors: string[];
  sort: Sort;
  /** How many pages are shown ("load more" appends the next one). */
  page: number;
};

export const NO_FILTERS: Filters = {
  sizes: [],
  min: null,
  max: null,
  sale: false,
  brands: [],
  colors: [],
  sort: "recommended",
  page: 1,
};

type Query = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** A comma list of values that match `pattern`, deduplicated, at most 20; anything else is dropped. */
function list(v: string | string[] | undefined, pattern: RegExp): string[] {
  const raw = first(v);
  if (!raw) return [];
  const values = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => pattern.test(s));
  return [...new Set(values)].slice(0, 20);
}

/** "20" or "19.90" CHF → Rappen; null for anything else (negative, too large, not a number). */
function money(v: string | string[] | undefined): number | null {
  const raw = first(v)?.trim();
  if (!raw || !/^\d{1,6}(\.\d{1,2})?$/.test(raw)) return null;
  return Math.round(Number(raw) * 100);
}

const SIZE = /^[\p{L}\p{N}./+-]{1,12}$/u;
const SLUG = /^[a-z0-9-]{1,60}$/;
const COLOR = /^[\p{L}\p{N} -]{1,30}$/u;

/** Filters from the query. Wrong or unknown values are ignored silently; a reversed price range is turned round. */
export function parseFilters(query: Query): Filters {
  let min = money(query.min);
  let max = money(query.max);
  if (min != null && max != null && min > max) [min, max] = [max, min];
  const sort = first(query.sort);
  const page = Number.parseInt(first(query.page) ?? "", 10);
  return {
    sizes: list(query.size, SIZE),
    min,
    max,
    sale: first(query.sale) === "1",
    brands: list(query.brand, SLUG),
    colors: list(query.color, COLOR),
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : "recommended",
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

const chf = (rappen: number) => (rappen % 100 === 0 ? String(rappen / 100) : (rappen / 100).toFixed(2));

/** The query for `filters` ("" for none), defaults left out; `page` only when asked for (load more). */
export function filtersQuery(filters: Filters, { page = false }: { page?: boolean } = {}): string {
  const q = new URLSearchParams();
  if (filters.sizes.length) q.set("size", filters.sizes.join(","));
  if (filters.min != null) q.set("min", chf(filters.min));
  if (filters.max != null) q.set("max", chf(filters.max));
  if (filters.sale) q.set("sale", "1");
  if (filters.brands.length) q.set("brand", filters.brands.join(","));
  if (filters.colors.length) q.set("color", filters.colors.join(","));
  if (filters.sort !== "recommended") q.set("sort", filters.sort);
  if (page && filters.page > 1) q.set("page", String(filters.page));
  const s = q.toString().replaceAll("%2C", ",");
  return s ? `?${s}` : "";
}

/** A listing link: `path` (which may carry its own query, e.g. "?category=t-shirts") with the filters added. */
export function listingHref(path: string, filters: Filters, options?: { page?: boolean }): string {
  const q = filtersQuery(filters, options);
  return q && path.includes("?") ? `${path}&${q.slice(1)}` : `${path}${q}`;
}

/** How many filter values are chosen (the number on the Filter button); a price range counts once. */
export function filterCount(f: Filters): number {
  return f.sizes.length + f.brands.length + f.colors.length + (f.sale ? 1 : 0) + (f.min != null || f.max != null ? 1 : 0);
}

export const hasFilters = (f: Filters) => filterCount(f) > 0;

/** Letter sizes in their order, then numbers ascending (children's sizes), then anything else alphabetically. */
const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const letter = LETTER_SIZES.indexOf(s.toUpperCase());
    if (letter >= 0) return [0, letter] as const;
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? ([1, n] as const) : ([2, 0] as const);
  };
  return [...new Set(sizes)].sort((a, b) => {
    const [ga, va] = rank(a);
    const [gb, vb] = rank(b);
    return ga - gb || va - vb || a.localeCompare(b);
  });
}

/** What a filter looks at of one product (built on the server, matched in the sheet for its live count). */
export type ProductFacet = {
  id: string;
  /** Sizes with stock that can be sold online. */
  sizes: string[];
  colors: string[];
  brand: string | null;
  /** Every variant's price (Rappen). */
  prices: number[];
  sale: boolean;
};

/**
 * Whether a product passes the filters: each group is "any of the chosen values", groups combine with "and";
 * a size counts only in stock; the price range matches when any variant's price lies in it.
 * The same rules as filterWhere(), which the server runs in the database.
 */
export function matchesFilters(p: ProductFacet, f: Filters): boolean {
  if (f.sizes.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
  if (f.colors.length && !p.colors.some((c) => f.colors.includes(c))) return false;
  if (f.brands.length && !(p.brand && f.brands.includes(p.brand))) return false;
  if (f.sale && !p.sale) return false;
  if (f.min != null || f.max != null) {
    const inRange = p.prices.some((x) => (f.min == null || x >= f.min) && (f.max == null || x <= f.max));
    if (!inRange) return false;
  }
  return true;
}

const inStockOnline = { inventory: { some: { quantity: { gt: 0 }, location: { sellsOnline: true } } } };

/** The filters as a Prisma condition on products (always combined with the store and the listing's own condition). */
export function filterWhere(f: Filters): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  if (f.sizes.length) {
    and.push({
      variants: {
        some: { OR: f.sizes.map((size) => ({ options: { path: ["size"], equals: size } })), ...inStockOnline },
      },
    });
  }
  if (f.colors.length) {
    and.push({ variants: { some: { OR: f.colors.map((color) => ({ options: { path: ["color"], equals: color } })) } } });
  }
  if (f.brands.length) and.push({ brand: { slug: { in: f.brands } } });
  if (f.sale) and.push({ variants: { some: { compareAtPrice: { not: null } } } });
  if (f.min != null || f.max != null) {
    and.push({
      variants: { some: { price: { ...(f.min != null && { gte: f.min }), ...(f.max != null && { lte: f.max }) } } },
    });
  }
  return and.length ? { AND: and } : {};
}

/** What sorting looks at of one product. */
export type SortKey = { price: number; discount: number; createdAt: Date; isNew: boolean; soldOut: boolean; id: string };

/**
 * Products in the chosen order; sold-out ones always last. Recommended: marked new first, then newest; price: the
 * cheapest variant's (as on the card); discount: the highest −X% of any variant.
 */
export function sortProducts<T extends SortKey>(items: T[], sort: Sort): T[] {
  const newest = (a: T, b: T) => b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1);
  const by: Record<Sort, (a: T, b: T) => number> = {
    recommended: (a, b) => Number(b.isNew) - Number(a.isNew) || newest(a, b),
    price_asc: (a, b) => a.price - b.price || newest(a, b),
    price_desc: (a, b) => b.price - a.price || newest(a, b),
    newest,
    discount: (a, b) => b.discount - a.discount || newest(a, b),
  };
  return [...items].sort((a, b) => Number(a.soldOut) - Number(b.soldOut) || by[sort](a, b));
}
