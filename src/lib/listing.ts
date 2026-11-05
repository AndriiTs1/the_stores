import type { Prisma } from "@/generated/prisma/client";
import { cardInclude, toProductCard, type CardRow, type ProductCardData } from "./catalog";
import { db } from "./db";
import { filterWhere, LISTING_PAGE, sortProducts, sortSizes, type Filters, type ProductFacet } from "./filters";
import { optionValueLabel, tr } from "./i18n";
import { onlineStock } from "./inventory";
import { discountPercent } from "./money";

/** One choice in a filter group: the value in the query and its label in the page language. */
export type FacetOption = { value: string; label: string };

export type ListingFacets = {
  /** Every product of the listing (before filtering), for the sheet's live count. */
  products: ProductFacet[];
  categories: FacetOption[];
  sizes: FacetOption[];
  colors: FacetOption[];
  brands: FacetOption[];
  /** Lowest and highest variant price in the listing (Rappen). */
  priceRange: [number, number] | null;
  /** Whether "only sale" would change anything (some products reduced, some not). */
  sale: boolean;
};

export type ListingResult = { cards: ProductCardData[]; total: number; hasMore: boolean; facets: ListingFacets };

const facetSelect = {
  id: true,
  optionValues: true,
  brand: { select: { slug: true, name: true } },
  category: { select: { slug: true, name: true, position: true } },
  variants: {
    select: {
      price: true,
      compareAtPrice: true,
      options: true,
      inventory: { select: { quantity: true, location: { select: { sellsOnline: true } } } },
    },
  },
} satisfies Prisma.ProductSelect;

type Options = Record<string, string | undefined>;

/**
 * A filtered, sorted page of a listing. `where` is the listing's own condition (category, collection, brand, sale);
 * store and status are always enforced here. The filtering runs in the database (filterWhere); the order is worked
 * out here, since it depends on every variant's price and stock (sold-out products last).
 */
export async function getListing(
  storeId: string,
  locale: string,
  where: Prisma.ProductWhereInput,
  filters: Filters,
): Promise<ListingResult> {
  const scope: Prisma.ProductWhereInput = { ...where, storeId, status: "ACTIVE" };
  const [all, rows] = await Promise.all([
    db.product.findMany({ where: scope, select: facetSelect }),
    db.product.findMany({ where: { AND: [scope, filterWhere(filters)] }, include: cardInclude }),
  ]);

  const sorted = sortProducts(rows.map(sortKey), filters.sort);
  const shown = sorted.slice(0, filters.page * LISTING_PAGE);
  return {
    cards: shown.map((r) => toProductCard(r.row, locale)),
    total: rows.length,
    hasMore: sorted.length > shown.length,
    facets: facets(all, locale),
  };
}

function sortKey(row: CardRow) {
  const prices = row.variants.map((v) => v.price);
  return {
    row,
    id: row.id,
    createdAt: row.createdAt,
    isNew: row.isNew,
    price: prices.length ? Math.min(...prices) : 0,
    discount: Math.max(0, ...row.variants.map((v) => discountPercent(v.price, v.compareAtPrice) ?? 0)),
    soldOut: row.variants.every((v) => onlineStock(v.inventory) === 0),
  };
}

function facets(rows: Prisma.ProductGetPayload<{ select: typeof facetSelect }>[], locale: string): ListingFacets {
  const sizeLabels = new Map<string, string>();
  const colorLabels = new Map<string, string>();
  const brands = new Map<string, string>();
  const categories = new Map<string, { label: string; position: number }>();
  const prices: number[] = [];
  const products = rows.map((p): ProductFacet => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    for (const v of p.variants) {
      const { size, color } = v.options as Options;
      prices.push(v.price);
      if (size && onlineStock(v.inventory) > 0) {
        sizes.add(size);
        sizeLabels.set(size, optionValueLabel(p.optionValues, "size", size, locale));
      }
      if (color) {
        colors.add(color);
        colorLabels.set(color, optionValueLabel(p.optionValues, "color", color, locale));
      }
    }
    if (p.brand) brands.set(p.brand.slug, p.brand.name);
    if (p.category) categories.set(p.category.slug, { label: tr(p.category.name, locale), position: p.category.position });
    return {
      id: p.id,
      category: p.category?.slug ?? null,
      sizes: [...sizes],
      colors: [...colors],
      brand: p.brand?.slug ?? null,
      prices: p.variants.map((v) => v.price),
      sale: p.variants.some((v) => v.compareAtPrice != null),
    };
  });
  const byLabel = (a: FacetOption, b: FacetOption) => a.label.localeCompare(b.label, locale);
  const onSale = products.filter((p) => p.sale).length;
  return {
    products,
    categories: [...categories]
      .sort(([, a], [, b]) => a.position - b.position)
      .map(([value, { label }]) => ({ value, label })),
    sizes: sortSizes([...sizeLabels.keys()]).map((value) => ({ value, label: sizeLabels.get(value)! })),
    colors: [...colorLabels].map(([value, label]) => ({ value, label })).sort(byLabel),
    brands: [...brands].map(([value, label]) => ({ value, label })).sort(byLabel),
    priceRange: prices.length ? [Math.min(...prices), Math.max(...prices)] : null,
    sale: onSale > 0 && onSale < products.length,
  };
}
