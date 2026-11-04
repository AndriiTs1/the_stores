"use client";

import { usePathname } from "next/navigation";
import { House, SquaresFour } from "@phosphor-icons/react";
import { BottomBar, type BottomBarItem } from "@/components/bottom-bar";
import { activeTab, storePath, tabHref, type Tab } from "@/lib/storefront-tabs";

/** The storefront's phone bar: one item per tab (lib/storefront-tabs), the current tab red. */
export function StorefrontBottomBar({
  base,
  locale,
  labels,
}: {
  base: string;
  locale: string;
  labels: { start: string; categories: string };
}) {
  const current = activeTab(storePath(usePathname(), base), locale);
  const item = (id: Tab, label: string, icon: BottomBarItem["icon"]): BottomBarItem => ({
    id,
    label,
    icon,
    href: tabHref(id, base, locale),
    active: current === id,
  });

  return <BottomBar items={[item("start", labels.start, House), item("categories", labels.categories, SquaresFour)]} />;
}
