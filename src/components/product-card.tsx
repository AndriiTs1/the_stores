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
    oneSize: string;
    oneOfAKind: string;
    secondStory: string;
    conditions: Record<string, string>;
    wishlistAdd: string;
    wishlistRemove: string;
  };
  preload?: boolean;
  eager?: boolean;
}) {
  const off = discountPercent(card.price, card.compareAt);
  return (
    // A column as tall as its grid row: the price sits at the bottom, level with the other cards in the row.
    <div className="relative flex h-full flex-col">
      <Link href={href} className="group flex flex-1 flex-col rounded-lg">
        <div className="relative">
          <ProductImage
            src={card.images[0]}
            hoverSrc={card.images[1]}
            title={card.brand ? `${card.brand} ${card.title}` : card.title}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            preload={preload}
            eager={eager}
          />
          {(off != null || card.soldOut || card.preloved) && (
            // Clear of the heart in the top right corner (44px); a long label wraps instead of running under it.
            <div className="absolute left-2 right-12 top-2 flex flex-col items-start gap-1">
              {off != null && (
                <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold tabular-nums text-accent-ink">
                  {discountLabel(off)}
                </span>
              )}
              {card.preloved && (
                // Grey, not red: second-hand is a kind of item, not a promotion.
                <span className="rounded bg-[#ecebe8] px-2 py-0.5 text-xs font-semibold text-foreground">
                  <span translate="no">{labels.secondStory}</span> · {labels.conditions[card.preloved.condition]}
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
        <div className="mt-2 flex flex-1 flex-col gap-0.5 text-sm">
          {/* Two lines at most; a long word breaks instead of widening the card. As high as the longest translation
              needs, so a title that wraps in one language only doesn't push the next row down on a switch. */}
          <StableText
            block
            text={card.title}
            variants={card.titleVariants}
            className="font-semibold [&>span]:line-clamp-2 [&>span]:hyphens-auto [&>span]:break-words"
          />
          <CardSizes sizes={card.sizes} soldOut={card.soldOut} oneOfAKind={!!card.preloved} labels={labels} />
          <p className="mt-auto pt-0.5 tabular-nums">
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
 * "Ausverkauft"; no sizes at all: "One Size" (so prices in a row stay level). A second-hand item adds "Einzelstück".
 * One line; sizes that don't fit are cut off rather than wrapped.
 */
function CardSizes({
  sizes,
  soldOut,
  oneOfAKind,
  labels,
}: {
  sizes: ProductCardData["sizes"];
  soldOut: boolean;
  oneOfAKind: boolean;
  labels: { sizes: string; soldOut: string; onlyLeft: string; oneSize: string; oneOfAKind: string };
}) {
  const className = "overflow-hidden whitespace-nowrap text-xs text-meta";
  if (soldOut) return <p className={className}>{labels.soldOut}</p>;
  const available = sizes.length ? sizes.filter((s) => !s.soldOut).map((s) => s.label) : [labels.oneSize];
  if (available.length === 0) return <p className={className}>{labels.soldOut}</p>;
  const text =
    available.length === 1 && sizes.length > 1 ? labels.onlyLeft.replace("{size}", available[0]) : available.join(" · ");
  return (
    <p className={className} aria-label={`${labels.sizes}: ${available.join(", ")}`}>
      {oneOfAKind ? `${text} · ${labels.oneOfAKind}` : text}
    </p>
  );
}
