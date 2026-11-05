"use client";

import { usePathname } from "next/navigation";
import { useId, useRef, type ReactNode } from "react";
import { Heart, House, PlusSquare, SquaresFour, User } from "@phosphor-icons/react";
import { AccountPanel, openAccountPanel, useAccountPanelOpen } from "@/components/account-panel";
import { BottomBar, type BottomBarItem } from "@/components/bottom-bar";
import { useWishlist } from "@/components/wishlist";
import { activeTab, storePath, tabHref, type Tab } from "@/lib/storefront-tabs";

/** Plus in a rounded square, drawn at 24px (its square is small for the box) in the bar's 22px icon slot. */
function SellIcon(props: { "aria-hidden"?: boolean }) {
  return <PlusSquare {...props} size={24} className="-m-px" />;
}

/**
 * The storefront's phone bar: one item per tab (lib/storefront-tabs), the current tab red; "Sell" in the middle.
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
    sell: string;
    sellLabel: string;
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
          { ...item("sell", labels.sell, SellIcon), ariaLabel: labels.sellLabel },
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
        base={base}
      >
        {accountPanel}
      </AccountPanel>
    </>
  );
}
