"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid, type GridLabels } from "@/components/product-grid";
import { useWishlist } from "@/components/wishlist";
import type { ProductCardData } from "@/lib/catalog";
import { wishlistCards } from "./actions";

/**
 * The saved products as cards. The ids live in this browser, so the cards are loaded after hydration;
 * a tap on a card's heart removes it here at once (the loaded cards are filtered, nothing is refetched).
 */
export function WishlistView({
  site,
  locale,
  base,
  currency,
  labels,
}: {
  site: string;
  locale: string;
  base: string;
  currency: string;
  labels: GridLabels & { empty: string; emptyText: string; browse: string };
}) {
  const { ids } = useWishlist();
  const [cards, setCards] = useState<ProductCardData[] | null>(null);

  // Fetch only when an id appears that has no card yet (first load, or saved in another tab).
  const missing = ids?.some((id) => !cards?.some((c) => c.id === id)) ?? false;
  useEffect(() => {
    if (!ids || !missing) return;
    let current = true;
    wishlistCards(site, locale, ids).then((next) => current && setCards(next));
    return () => {
      current = false;
    };
  }, [ids, missing, site, locale]);

  if (ids === null || (missing && cards === null)) return <p className="text-sm text-meta" aria-busy="true" />;

  const shown = (cards ?? []).filter((c) => ids.includes(c.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  if (shown.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-lg font-semibold">{labels.empty}</p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-meta">{labels.emptyText}</p>
        <Link href={`${base}/${locale}#selection`} className="btn btn-accent mt-6">
          {labels.browse}
        </Link>
      </div>
    );
  }
  return <ProductGrid cards={shown} moreHref={null} base={base} locale={locale} currency={currency} labels={labels} />;
}
