"use client";

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
