"use client";

import Link from "next/link";
import { createContext, useContext, useState, useSyncExternalStore } from "react";
import { Heart } from "@phosphor-icons/react";
import { browserWishlistStorage, createWishlist, type Wishlist } from "@/lib/wishlist";

const WishlistContext = createContext<Wishlist | null>(null);

/** One wishlist per store, kept in this browser (lib/wishlist). */
export function WishlistProvider({ storeSlug, children }: { storeSlug: string; children: React.ReactNode }) {
  const [wishlist] = useState(() => createWishlist(browserWishlistStorage(storeSlug)));
  return <WishlistContext.Provider value={wishlist}>{children}</WishlistContext.Provider>;
}

const unread = () => null;

/** Saved product ids, newest first; null until read in the browser (the server can't know them). */
export function useWishlist() {
  const wishlist = useContext(WishlistContext);
  if (!wishlist) throw new Error("useWishlist needs a WishlistProvider");
  const ids = useSyncExternalStore(wishlist.subscribe, wishlist.get, unread);
  return { ids, toggle: wishlist.toggle, remove: wishlist.remove };
}

/**
 * Heart that saves or removes a product: outline when not saved, filled red when saved.
 * `overlay`: a white circle behind it, for the corner of a product photo. 44×44 tap area either way.
 */
export function WishlistButton({
  productId,
  labels,
  overlay = false,
  className = "",
}: {
  productId: string;
  labels: { add: string; remove: string };
  overlay?: boolean;
  className?: string;
}) {
  const { ids, toggle } = useWishlist();
  const saved = ids?.includes(productId) ?? false;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? labels.remove : labels.add}
      onClick={() => toggle(productId)}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full [-webkit-tap-highlight-color:transparent] ${className}`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full transition-colors ${
          overlay ? "size-8 bg-background/90" : ""
        } ${saved ? "text-accent" : "text-foreground hover:text-accent"}`}
      >
        <Heart aria-hidden size={overlay ? 18 : 24} weight={saved ? "fill" : "regular"} />
      </span>
    </button>
  );
}

/**
 * Header link to the wishlist (from md; phones have the bottom-bar tab): an outline heart like the cart next to it,
 * with a red count when something is saved.
 */
export function WishlistHeaderLink({
  href,
  labels,
  className = "",
}: {
  href: string;
  /** count: e.g. "Merkliste, {n}". */
  labels: { wishlist: string; count: string };
  className?: string;
}) {
  const n = useWishlist().ids?.length ?? 0;
  return (
    <Link
      href={href}
      aria-label={n > 0 ? labels.count.replace("{n}", String(n)) : labels.wishlist}
      className={`group relative size-11 items-center justify-center rounded-full text-foreground ${className}`}
    >
      {/* Badge against the 22px icon, as on the cart. */}
      <span className="relative inline-flex transition group-hover:opacity-70">
        <Heart aria-hidden size={22} weight="bold" />
        {n > 0 && (
          <span
            aria-hidden
            className="absolute -right-2.5 -top-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none tabular-nums text-accent-ink"
          >
            {n > 99 ? "99+" : n}
          </span>
        )}
      </span>
    </Link>
  );
}
