import type { Prisma } from "@/generated/prisma/client";
import { ProductGrid } from "@/components/product-grid";
import { getProductCards, itemLimit, moreHref } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";

/** A product listing page (collection, category, brand): heading, grid, "show more" via ?n=. */
export async function Listing({
  title,
  where,
  path,
  n,
  storeId,
  locale,
  base,
  currency,
  d,
}: {
  title: string;
  /** Narrows the store's active products. */
  where: Prisma.ProductWhereInput;
  /** This page without the query, e.g. "/s/demo/de/brands/muster-sport". */
  path: string;
  /** The raw ?n= value. */
  n: unknown;
  storeId: string;
  locale: string;
  base: string;
  currency: string;
  d: Dict;
}) {
  const limit = itemLimit(n);
  const { cards, hasMore } = await getProductCards(storeId, locale, where, limit);
  return (
    <>
      <h1 className="mb-6 hyphens-auto break-words text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
      {cards.length === 0 ? (
        <p className="text-muted">{d.noProducts}</p>
      ) : (
        <ProductGrid
          cards={cards}
          moreHref={hasMore ? moreHref(path, limit) : null}
          base={base}
          locale={locale}
          currency={currency}
          labels={{ soldOut: d.soldOut, sizes: d.sizes, showMore: d.showMore }}
          preloadFirst
        />
      )}
    </>
  );
}
