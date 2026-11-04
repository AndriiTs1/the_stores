"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { GlobeSimple, House, MagnifyingGlass } from "@phosphor-icons/react";
import {
  BAR_POPUP_OFFSET,
  BarItemFace,
  BottomBar,
  barItemClass,
  barItemColor,
  type BottomBarItem,
} from "@/components/bottom-bar";
import { LanguagePicker } from "@/components/language-picker";

/**
 * The storefront's phone bar: Home, Search (the search page), Language.
 * Favourites and Account come back once they work.
 */
export function StorefrontBottomBar({
  base,
  locale,
  locales,
  labels,
}: {
  base: string;
  locale: string;
  locales: string[];
  labels: { home: string; search: string; language: string; languageButton: string };
}) {
  const pathname = usePathname();

  // Home is active on the catalogue and on product pages.
  const rest = pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname.replace(/^\/s\/[^/]+/, "");
  const home = `/${locale}`;
  const onHome = rest === home || rest === `${home}/` || rest.startsWith(`${home}/p/`);
  const onSearch = rest === `${home}/search`;

  const items: BottomBarItem[] = [
    { id: "home", label: labels.home, icon: House, href: `${base}${home}`, active: onHome },
    { id: "search", label: labels.search, icon: MagnifyingGlass, href: `${base}/${locale}/search`, active: onSearch },
    {
      id: "language",
      label: labels.language,
      icon: GlobeSimple,
      render: () => (
        <Suspense fallback={<span className={`${barItemClass} ${barItemColor(false)}`} />}>
          <LanguagePicker
            locales={locales}
            current={locale}
            base={base}
            buttonLabel={labels.languageButton}
            sideOffset={BAR_POPUP_OFFSET}
            triggerClassName={`${barItemClass} ${barItemColor(false)} data-[state=open]:text-foreground`}
            icon={() => <BarItemFace icon={GlobeSimple} label={labels.language} />}
          />
        </Suspense>
      ),
    },
  ];

  return <BottomBar items={items} />;
}
