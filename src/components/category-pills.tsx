"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type Pill = { href: string; label: ReactNode; sale?: boolean };

/**
 * Phones only (< md), under the header on the catalogue pages (home, categories, sale, all products): the store's
 * top categories as a row of outlined pills, Sale last in red. The row scrolls sideways and snaps, without a
 * scrollbar; the next pill peeks in at the edge. The current category gets a 1.5px dark outline (no black fill),
 * drawn as an inset shadow so the pill keeps its size. Labels keep the width of their longest translation.
 */
export function CategoryPills({ pills, home, label }: { pills: Pill[]; home: string; label: string }) {
  const pathname = usePathname();
  const catalogue =
    pathname === home || pathname.startsWith(`${home}/collections/`) || [`${home}/sale`, `${home}/products`].includes(pathname);
  if (!catalogue || pills.length === 0) return null;
  return (
    <nav aria-label={label} className="mt-3 md:hidden">
      <ul className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 sm:scroll-px-6 sm:px-6">
        {pills.map((p) => {
          const current = pathname === p.href;
          return (
            <li key={p.href} className="shrink-0 snap-start">
              <Link
                href={p.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex h-10 items-center whitespace-nowrap rounded-[20px] border px-4 text-sm ${
                  p.sale ? "border-accent font-bold text-accent" : "border-[#d6d6d2] font-medium text-foreground"
                } ${current ? "border-transparent shadow-[inset_0_0_0_1.5px_var(--foreground)]" : ""}`}
              >
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
