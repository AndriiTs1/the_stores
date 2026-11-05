"use server";

import { getProductCards, type ProductCardData } from "@/lib/catalog";
import { getStoreAndLocale } from "@/lib/tenant";
import { MAX_ITEMS } from "@/lib/wishlist";

/**
 * Cards for the saved product ids, in the list's order, with today's price and stock.
 * Ids come from the browser: only strings, at most MAX_ITEMS, and only active products of this store are returned
 * (removed or hidden products simply drop out).
 */
export async function wishlistCards(site: string, rawLocale: string, ids: unknown): Promise<ProductCardData[]> {
  const list = Array.isArray(ids)
    ? [...new Set(ids.filter((id): id is string => typeof id === "string" && id.length <= 64))].slice(0, MAX_ITEMS)
    : [];
  if (list.length === 0) return [];
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const { cards } = await getProductCards(store.id, locale, { id: { in: list } }, list.length);
  const byId = new Map(cards.map((c) => [c.id, c]));
  return list.flatMap((id) => byId.get(id) ?? []);
}
