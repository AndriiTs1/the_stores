"use client";

import { usePathname } from "next/navigation";
import { useId, useRef, type ReactNode } from "react";
import { Heart, House, SquaresFour, User } from "@phosphor-icons/react";
import { AccountPanel, openAccountPanel, useAccountPanelOpen } from "@/components/account-panel";
import { BottomBar, type BottomBarItem } from "@/components/bottom-bar";
import { useWishlist } from "@/components/wishlist";
import { activeTab, storePath, tabHref, type Tab } from "@/lib/storefront-tabs";

/**
 * The storefront's phone bar: one item per tab (lib/storefront-tabs), the current tab red.
 * Account opens the side panel with `accountPanel` instead of going to /account.
 */
export function StorefrontBottomBar({
  base,
  locale,
  labels,
  accountPanel,
}: {
  base: string;
  locale: string;
  labels: {
    start: string;
    categories: string;
    wishlist: string;
    wishlistLabel: string;
    account: string;
    close: string;
  };
  accountPanel: ReactNode;
}) {
  const panelOpen = useAccountPanelOpen();
  const panelId = useId();
  const accountButton = useRef<HTMLButtonElement>(null);
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
    <>
      <BottomBar
        items={[
          item("start", labels.start, House),
          item("categories", labels.categories, SquaresFour),
          {
            ...item("wishlist", labels.wishlist, Heart),
            badge: saved,
            ariaLabel: saved ? labels.wishlistLabel.replace("{n}", String(saved)) : undefined,
          },
          {
            ...item("account", labels.account, User),
            href: undefined,
            dialog: { onOpen: openAccountPanel, open: panelOpen, controls: panelId, ref: accountButton },
          },
        ]}
      />
      <AccountPanel
        id={panelId}
        open={panelOpen}
        title={labels.account}
        closeLabel={labels.close}
        returnFocus={accountButton}
      >
        {accountPanel}
      </AccountPanel>
    </>
  );
}
