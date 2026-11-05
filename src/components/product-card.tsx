import Link from "next/link";
import type { ReactNode } from "react";
import { ProductImage } from "@/components/product-image";
import { StableText } from "@/components/stable-text";
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
  eager = false,
}: {
  card: ProductCardData;
  href: string;
  locale: string;
  currency: string;
  labels: {
    soldOut: string;
    soldOutBadge: ReactNode;
    sizes: string;
    /** "Nur noch {size}". */
    onlyLeft: string;
    wishlistAdd: string;
    wishlistRemove: string;
  };
  preload?: boolean;
  eager?: boolean;
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
            eager={eager}
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
                  {labels.soldOutBadge}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 space-y-0.5 text-sm">
          {/* Two lines at most; a long word breaks instead of widening the card. As high as the longest translation
              needs, so a title that wraps in one language only doesn't push the next row down on a switch. */}
          <StableText
            block
            text={card.title}
            variants={card.titleVariants}
            className="font-semibold [&>span]:line-clamp-2 [&>span]:hyphens-auto [&>span]:break-words"
          />
          <CardSizes sizes={card.sizes} soldOut={card.soldOut} labels={labels} />
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

/**
 * Sizes one can still buy, nothing struck through: "S · M · L"; the last one left: "Nur noch M"; none left: a grey
 * "Ausverkauft". One line; sizes that don't fit are cut off rather than wrapped. Nothing for products without sizes.
 */
function CardSizes({
  sizes,
  soldOut,
  labels,
}: {
  sizes: ProductCardData["sizes"];
  soldOut: boolean;
  labels: { sizes: string; soldOut: string; onlyLeft: string };
}) {
  const available = sizes.filter((s) => !s.soldOut).map((s) => s.label);
  const className = "overflow-hidden whitespace-nowrap text-xs text-meta";
  if (soldOut && (sizes.length > 0 || available.length === 0)) return <p className={className}>{labels.soldOut}</p>;
  if (available.length === 0) return null;
  if (available.length === 1 && sizes.length > 1) {
    return <p className={className}>{labels.onlyLeft.replace("{size}", available[0])}</p>;
  }
  return (
    <p className={className} aria-label={`${labels.sizes}: ${available.join(", ")}`}>
      {available.join(" · ")}
    </p>
  );
}
