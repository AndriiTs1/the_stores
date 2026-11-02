"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GlobeSimple, Heart, House, MagnifyingGlass, User } from "@phosphor-icons/react";
import { BottomBar, DOCK_POPUP_OFFSET, dockButtonClass, type BottomBarItem } from "@/components/bottom-bar";
import { LanguagePicker } from "@/components/language-picker";

const HINT_MS = 1500;

/**
 * The storefront's phone dock: Home, Search (the search page), Favourites, Account, Language.
 * Favourites / Account are placeholders for now: they show "coming soon" for 1.5 s.
 * Only one popup at a time: opening the language capsule closes the hint (and a press outside the
 * open capsule only closes it, so a hint can't appear on top of it).
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
  labels: {
    home: string;
    search: string;
    favorites: string;
    account: string;
    comingSoon: string;
    languageButton: string;
  };
}) {
  const pathname = usePathname();
  // `at` changes on every tap, so a repeated tap restarts the 1.5 s timer.
  const [hint, setHint] = useState<{ id: string; text: string; at: number } | null>(null);
  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(null), HINT_MS);
    return () => clearTimeout(t);
  }, [hint]);

  const showHint = (id: string) => setHint((prev) => ({ id, text: labels.comingSoon, at: (prev?.at ?? 0) + 1 }));
  const hideHint = () => setHint(null);

  // Home is active on the catalogue and on product pages.
  const rest = pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : pathname.replace(/^\/s\/[^/]+/, "");
  const home = `/${locale}`;
  const onHome = rest === home || rest === `${home}/` || rest.startsWith(`${home}/p/`);
  const onSearch = rest === `${home}/search`;

  const placeholder = (id: string, label: string, icon: BottomBarItem["icon"]): BottomBarItem => ({
    id,
    label,
    icon,
    onClick: () => showHint(id),
  });

  const items: BottomBarItem[] = [
    { id: "home", label: labels.home, icon: House, href: `${base}${home}`, active: onHome },
    { id: "search", label: labels.search, icon: MagnifyingGlass, href: `${base}/${locale}/search`, active: onSearch },
    placeholder("favorites", labels.favorites, Heart),
    placeholder("account", labels.account, User),
    {
      id: "language",
      label: labels.languageButton,
      icon: GlobeSimple,
      render: () => (
        <Suspense fallback={<span className="inline-block size-12" />}>
          <LanguagePicker
            locales={locales}
            current={locale}
            base={base}
            buttonLabel={labels.languageButton}
            onOpenChange={(open) => open && hideHint()}
            sideOffset={DOCK_POPUP_OFFSET}
            triggerClassName={`${dockButtonClass} text-white/75 data-[state=open]:text-white`}
            icon={() => <GlobeSimple aria-hidden size={22} weight="bold" />}
          />
        </Suspense>
      ),
    },
  ];

  return <BottomBar items={items} hint={hint} onHintDismiss={hideHint} />;
}
