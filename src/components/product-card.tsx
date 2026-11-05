import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import { WishlistButton } from "@/components/wishlist";
import type { ProductCardData } from "@/lib/catalog";
import { discountLabel, discountPercent, formatMoney } from "@/lib/money";

/**
 * Grid card: photo (second one on hover) with badges (discount, sold out) and the wishlist heart, name, sizes on one
 * line, price in CHF.
 * The heart is a sibling of the product link, not inside it (no button within a link).
 */
export function ProductCard({
  card,
  href,
  locale,
  currency,
  labels,
  preload = false,
}: {
  card: ProductCardData;
  href: string;
  locale: string;
  currency: string;
  labels: {
    soldOut: string;
    sizes: string;
    wishlistAdd: string;
    wishlistRemove: string;
  };
  preload?: boolean;
}) {
  const off = discountPercent(card.price, card.compareAt);
  return (
    <div className="relative">
      <Link href={href} className="group block rounded-lg">
        <div className="relative">
          <ProductImage
            src={card.images[0]}
            hoverSrc={card.images[1]}
            title={card.brand ? `${card.brand} ${card.title}` : card.title}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            preload={preload}
          />
          {(off != null || card.soldOut) && (
            <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
              {off != null && (
                <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold tabular-nums text-accent-ink">
                  {discountLabel(off)}
                </span>
              )}
              {card.soldOut && (
                <span className="rounded bg-foreground px-2 py-0.5 text-xs font-semibold text-background">
                  {labels.soldOut}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 space-y-0.5 text-sm">
          {/* Two lines at most; a long word breaks instead of widening the card. */}
          <p className="line-clamp-2 hyphens-auto break-words font-semibold">{card.title}</p>
          {card.sizes.length > 0 && (
            // One line: sizes that don't fit are cut off rather than wrapped.
            <p className="overflow-hidden whitespace-nowrap text-xs text-meta" aria-label={labels.sizes}>
              {card.sizes.map((s, i) => (
                <span key={s.label}>
                  {i > 0 && <span aria-hidden> · </span>}
                  <span className={s.soldOut ? "line-through" : ""}>{s.label}</span>
                  {s.soldOut && <span className="sr-only"> ({labels.soldOut})</span>}
                </span>
              ))}
            </p>
          )}
          <p className="pt-0.5 tabular-nums">
            <span className={`font-semibold ${card.compareAt ? "text-accent" : ""}`}>
              {formatMoney(card.price, locale, currency)}
            </span>
            {card.compareAt && (
              <span className="ml-2 text-xs text-meta line-through">
                {formatMoney(card.compareAt, locale, currency)}
              </span>
            )}
          </p>
        </div>
      </Link>
      <WishlistButton
        productId={card.id}
        labels={{ add: labels.wishlistAdd, remove: labels.wishlistRemove }}
        overlay
        className="absolute right-0.5 top-0.5"
      />
    </div>
  );
}
