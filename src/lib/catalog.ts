import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { optionValueLabel, tr, trVariants } from "./i18n";
import { inventoryInclude, onlineStock } from "./inventory";

/** Products per "show more" step: 2 rows on a 4-column desktop grid, 6 on a 2-column phone grid. */
export const PAGE_SIZE = 12;
export const MAX_ITEMS = 96;

/** "?n=24" → products to show: whole pages, at least one, at most MAX_ITEMS. Anything else → one page. */
export function itemLimit(n: unknown): number {
  const v = typeof n === "string" ? Number.parseInt(n, 10) : Number.NaN;
  if (!Number.isFinite(v) || v <= PAGE_SIZE) return PAGE_SIZE;
  return Math.min(MAX_ITEMS, Math.ceil(v / PAGE_SIZE) * PAGE_SIZE);
}

export type ProductCardData = {
  id: string;
  slug: string;
  brand: string | null;
  title: string;
  /** The title in every language: the card keeps room for the longest (no jump when the language changes). */
  titleVariants: string[];
  /** First two photos: the second is shown on hover. */
  images: string[];
  /** Sizes in variant order; a size is sold out when none of its variants (colours) is in stock. */
  sizes: { label: string; soldOut: boolean }[];
  /** Lowest variant price (Rappen) and that variant's compare-at price. */
  price: number;
  compareAt: number | null;
  soldOut: boolean;
};

export const cardInclude = {
  brand: { select: { name: true } },
  variants: { include: inventoryInclude, orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

export type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function toProductCard(p: CardRow, locale: string): ProductCardData {
  const stock = p.variants.map((v) => ({ v, n: onlineStock(v.inventory) }));
  const cheapest = p.variants.reduce<CardRow["variants"][number] | null>(
    (min, v) => (min == null || v.price < min.price ? v : min),
    null,
  );

  const sizes = new Map<string, boolean>(); // size value → in stock somewhere
  if (p.optionNames.includes("size")) {
    for (const { v, n } of stock) {
      const size = (v.options as Record<string, string>).size;
      if (size != null) sizes.set(size, (sizes.get(size) ?? false) || n > 0);
    }
  }

  return {
    id: p.id,
    slug: p.slug,
    brand: p.brand?.name ?? null,
    title: tr(p.title, locale),
    titleVariants: trVariants(p.title),
    images: p.images.slice(0, 2),
    sizes: [...sizes].map(([value, inStock]) => ({
      label: optionValueLabel(p.optionValues, "size", value, locale),
      soldOut: !inStock,
    })),
    price: cheapest?.price ?? 0,
    compareAt: cheapest?.compareAtPrice ?? null,
    soldOut: stock.every(({ n }) => n === 0),
  };
}

/**
 * Active products of one store, newest first, as card data. `where` narrows further (category, brand, …);
 * store and status are always enforced here. Fetches one extra row to know whether there are more.
 */
export async function getProductCards(
  storeId: string,
  locale: string,
  where: Prisma.ProductWhereInput,
  limit: number,
): Promise<{ cards: ProductCardData[]; hasMore: boolean }> {
  const rows = await db.product.findMany({
    where: { ...where, storeId, status: "ACTIVE" },
    include: cardInclude,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });
  return { cards: rows.slice(0, limit).map((p) => toProductCard(p, locale)), hasMore: rows.length > limit };
}

/** Products on sale: at least one variant with a compare-at (former) price. */
export const ON_SALE = { variants: { some: { compareAtPrice: { not: null } } } } satisfies Prisma.ProductWhereInput;

/** Whether the store has an active product on sale: the Sale tile and menu item show only then. Once per request. */
export const hasSale = cache(
  async (storeId: string) => (await db.product.count({ where: { storeId, status: "ACTIVE", ...ON_SALE }, take: 1 })) > 0,
);

/** Link for "show more": the same listing with one more page. `params` keeps e.g. the search query. */
export function moreHref(path: string, limit: number, params: Record<string, string> = {}) {
  return `${path}?${new URLSearchParams({ ...params, n: String(limit + PAGE_SIZE) })}`;
}

/** Search query from ?q=: trimmed, at most 100 characters; "" when missing. */
export function searchQuery(q: unknown): string {
  return typeof q === "string" ? q.trim().slice(0, 100) : "";
}

/**
 * Ids of a store's active products whose title (page language or German) or brand contains `q`,
 * case-insensitive. LIKE wildcards in `q` are escaped; values are bound parameters.
 */
export async function searchProductIds(storeId: string, locale: string, q: string): Promise<string[]> {
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT p."id" FROM "Product" p
    LEFT JOIN "Brand" b ON b."id" = p."brandId"
    WHERE p."storeId" = ${storeId}
      AND p."status" = 'ACTIVE'
      AND (p."title"->>${locale} ILIKE ${pattern} OR p."title"->>'de' ILIKE ${pattern} OR b."name" ILIKE ${pattern})
    LIMIT 500`;
  return rows.map((r) => r.id);
}
