"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { parseLine, resolveLine, withLine, type LineId } from "@/lib/lines";

export type LineTab = { id: LineId; label: string };

/** Pages with the switcher: the home page and every listing (category, collection, brand, search, all products). */
function isListing(pathname: string, home: string) {
  if (pathname === home) return true;
  const rest = pathname.slice(home.length);
  return /^\/(collections|brands|categories)\/[^/]+$/.test(rest) || rest === "/search" || rest === "/products";
}

/**
 * Outlet · Neu · Second Story as a segmented control: grey track, the current part white with a shadow, dark text (no
 * red). Links: the same page in another part, keeping a search query, dropping filters and paging. Only parts with
 * products are shown, and only on the home page and listings (not on a product, the cart or the wishlist).
 * «Second Story» is a name: translate="no".
 */
export function LineSwitcher({ tabs, home, label, afterBanner = false }: { tabs: LineTab[]; home: string; label: string; afterBanner?: boolean }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (tabs.length < 2 || !isListing(pathname, home)) return null;
  if (pathname === home && !afterBanner) return null;
  if (pathname !== home && afterBanner) return null;
  const current = resolveLine(
    parseLine(params.get("line")),
    tabs.map((t) => t.id),
  );
  const q = params.get("q");
  const href = (line: LineId) => withLine(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, line);
  return (
    <nav aria-label={label} className={afterBanner ? "w-full rounded-lg md:max-w-none xl:max-w-[420px] border border-white/70 bg-white/90 p-1 shadow-sm" : "container-page mt-2"}>
      <ul className={afterBanner ? "flex w-full items-center gap-1" : "flex w-fit items-center justify-start gap-5 sm:gap-7"}>
        {[...tabs].sort((a, b) => {
          const order = { NEW: 0, OUTLET: 1, PRELOVED: 2 };
          return order[a.id] - order[b.id];
        }).map((t) => {
          const active = t.id === current;
          return (
            <li key={t.id} className={afterBanner ? "min-w-0 flex-1" : undefined}>
              <Link
                href={href(t.id)}
                scroll={false}
                onClick={afterBanner ? () => {
                  document.getElementById("selection")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                } : undefined}
                aria-current={active ? "page" : undefined}
                translate={t.id === "PRELOVED" ? "no" : undefined}
                className={`${afterBanner
                  ? `flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-md px-2 text-sm transition-colors ${
                      active
                        ? "bg-neutral-950 font-semibold text-white"
                        : "font-medium text-neutral-700 hover:bg-neutral-100"
                    }`
                  : `inline-flex min-h-9 items-center justify-center whitespace-nowrap border-b-2 px-1 text-sm transition-colors md:px-2 ${
                      active
                    ? "border-[#D6092F] font-semibold text-foreground"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                }`}`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The current ?line= (as asked, not resolved): list links keep it. */
export function useLineHref() {
  const asked = parseLine(useSearchParams().get("line"));
  return (href: string) => (asked ? withLine(href, asked) : href);
}
