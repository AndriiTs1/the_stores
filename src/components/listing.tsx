import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { FilterBar, type FilterLabels } from "@/components/filter-bar";
import { gridLabels, ProductGrid } from "@/components/product-grid";
import { hasFilters, listingHref, NO_FILTERS, parseFilters } from "@/lib/filters";
import { dictVariants, plural, type Dict } from "@/lib/i18n";
import { parseLine, resolveLine, withLine } from "@/lib/lines";
import { storeLines } from "@/lib/store-lines";
import { getListing } from "@/lib/listing";

/** The filter sheet's texts from the page dictionary. */
const filterLabels = (d: Dict, locales: readonly string[]): FilterLabels => ({
  filter: d.filter,
  filterVariants: dictVariants("filter", locales),
  sort: d.sort,
  sorts: {
    recommended: d.sortRecommended,
    price_asc: d.sortPriceAsc,
    price_desc: d.sortPriceDesc,
    newest: d.sortNewest,
    discount: d.sortDiscount,
  },
  category: d.category,
  size: d.size,
  price: d.price,
  priceFrom: d.priceFrom,
  priceTo: d.priceTo,
  onlySale: d.onlyReduced,
  brand: d.brand,
  color: d.color,
  showOne: d.showItemsOne,
  showOther: d.showItemsOther,
  reset: d.reset,
  resetAll: d.resetAll,
  close: d.close,
  removeFilter: d.removeFilter,
  fromPrice: d.fromPrice,
  upToPrice: d.upToPrice,
});

/**
 * A product listing page (collection, category, brand, sale, all products): the title with the number of products,
 * the filter and sort line, the grid of 24 with "load more", or "nothing found" with a way back. Filters, order and
 * page come from the query (lib/filters); wrong values are ignored.
 */
export async function Listing({
  title,
  where,
  path,
  query,
  storeId,
  locale,
  currency,
  base,
  d,
  locales,
}: {
  title: string;
  /** Narrows the store's active products. */
  where: Prisma.ProductWhereInput;
  /** This page without filters, e.g. "/s/demo/de/collections/herren" (may carry its own query: "?category=…"). */
  path: string;
  query: Record<string, string | string[] | undefined>;
  storeId: string;
  locale: string;
  currency: string;
  base: string;
  d: Dict;
  /** The store's languages (labels keep the width of the longest). */
  locales: readonly string[];
}) {
  const filters = parseFilters(query);
  // The part of the store (Outlet, Neu, Second Story): as asked in ?line=, else the first with products. The asked
  // line stays in every link of the page (filters, pills, load more).
  const asked = parseLine(query.line);
  const line = resolveLine(asked, await storeLines(storeId));
  path = withLine(path, asked);
  const scoped: Prisma.ProductWhereInput = line ? { AND: [where, { line }] } : where;
  const { cards, total, hasMore, facets } = await getListing(storeId, locale, scoped, filters);
  return (
    <>
      <h1 className="hyphens-auto break-words text-2xl font-black tracking-tight md:text-[32px]">
        {title}{" "}
        <span className="ml-1 align-middle font-sans text-sm font-medium tracking-normal text-meta md:text-base">
          · {plural(total, locale, d.itemsOne, d.itemsOther)}
        </span>
      </h1>
      {/* One box for the filter line and the products: a sticky element sticks only within its parent. */}
      <div className="mt-2">
        <FilterBar
          path={path}
          filters={filters}
          facets={facets}
          locale={locale}
          currency={currency}
          labels={filterLabels(d, locales)}
        />
        <div className="mt-4">
          {cards.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold">{facets.products.length ? d.noResults : d.noProducts}</p>
              {hasFilters(filters) && (
                <Link
                  href={listingHref(path, { ...NO_FILTERS, sort: filters.sort })}
                  scroll={false}
                  className="btn btn-ghost mt-6"
                >
                  {d.resetFilters}
                </Link>
              )}
            </div>
          ) : (
            <ProductGrid
              cards={cards}
              moreHref={hasMore ? listingHref(path, { ...filters, page: filters.page + 1 }, { page: true }) : null}
              base={base}
              locale={locale}
              currency={currency}
              labels={{ ...gridLabels(d), showMore: d.loadMore }}
              preloadFirst
            />
          )}
        </div>
      </div>
    </>
  );
}
