import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { ProductCardData } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";

export type GridLabels = {
  soldOut: string;
  sizes: string;
  showMore: string;
  wishlistAdd: string;
  wishlistRemove: string;
};

/** The grid's texts from the page dictionary. */
export const gridLabels = (d: Dict): GridLabels => ({
  soldOut: d.soldOut,
  sizes: d.sizes,
  showMore: d.showMore,
  wishlistAdd: d.wishlistAdd,
  wishlistRemove: d.wishlistRemove,
});

/**
 * 2 columns on phones, 3 on tablets, 4 on desktop. "Show more" is a link to the same page with a
 * larger ?n=: client-side navigation without scrolling, so the next cards appear below without a reload
 * (and it still works without JavaScript).
 */
export function ProductGrid({
  cards,
  moreHref,
  base,
  locale,
  currency,
  labels,
  preloadFirst = false,
}: {
  cards: ProductCardData[];
  /** null when everything is shown. */
  moreHref: string | null;
  base: string;
  locale: string;
  currency: string;
  labels: GridLabels;
  /** Preload the first two photos (the grid is the top of the page). */
  preloadFirst?: boolean;
}) {
  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card, i) => (
          <li key={card.id}>
            <ProductCard
              card={card}
              href={`${base}/${locale}/p/${card.slug}`}
              locale={locale}
              currency={currency}
              labels={labels}
              preload={preloadFirst && i < 2}
            />
          </li>
        ))}
      </ul>
      {moreHref && (
        <div className="mt-10 flex justify-center">
          <Link href={moreHref} scroll={false} className="btn btn-ghost">
            {labels.showMore}
          </Link>
        </div>
      )}
    </>
  );
}
