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
export function LineSwitcher({ tabs, home, label }: { tabs: LineTab[]; home: string; label: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  if (tabs.length < 2 || !isListing(pathname, home)) return null;
  const current = resolveLine(
    parseLine(params.get("line")),
    tabs.map((t) => t.id),
  );
  const q = params.get("q");
  const href = (line: LineId) => withLine(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, line);
  return (
    <nav aria-label={label} className="container-page mt-3 md:mt-6">
      <ul className="grid w-full auto-cols-fr grid-flow-col rounded-full bg-field p-1 md:inline-grid md:w-auto">
        {tabs.map((t) => {
          const active = t.id === current;
          return (
            <li key={t.id} className="flex">
              <Link
                href={href(t.id)}
                scroll={false}
                aria-current={active ? "page" : undefined}
                translate={t.id === "PRELOVED" ? "no" : undefined}
                className={`flex h-9 w-full items-center justify-center whitespace-nowrap rounded-full px-4 text-sm text-foreground transition-[background-color,box-shadow] md:px-6 ${
                  active ? "bg-background font-semibold shadow-[0_1px_3px_rgb(17_17_17/0.15)]" : "font-medium hover:bg-background/60"
                }`}
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
