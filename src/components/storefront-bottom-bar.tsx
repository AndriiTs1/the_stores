"use client";

import { usePathname } from "next/navigation";
import { Heart, House, SquaresFour, User } from "@phosphor-icons/react";
import { BottomBar, type BottomBarItem } from "@/components/bottom-bar";
import { useWishlist } from "@/components/wishlist";
import { activeTab, storePath, tabHref, type Tab } from "@/lib/storefront-tabs";

/** The storefront's phone bar: one item per tab (lib/storefront-tabs), the current tab red. */
export function StorefrontBottomBar({
  base,
  locale,
  labels,
}: {
  base: string;
  locale: string;
  labels: { start: string; categories: string; wishlist: string; wishlistLabel: string; account: string };
}) {
  const current = activeTab(storePath(usePathname(), base), locale);
  const saved = useWishlist().ids?.length ?? 0;
  const item = (id: Tab, label: string, icon: BottomBarItem["icon"]): BottomBarItem => ({
    id,
    label,
    icon,
    href: tabHref(id, base, locale),
    active: current === id,
  });

  return (
    <BottomBar
      items={[
        item("start", labels.start, House),
        item("categories", labels.categories, SquaresFour),
        {
          ...item("wishlist", labels.wishlist, Heart),
          badge: saved,
          ariaLabel: saved ? labels.wishlistLabel.replace("{n}", String(saved)) : undefined,
        },
        item("account", labels.account, User),
      ]}
    />
  );
}
