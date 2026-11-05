"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { dropAccountPanel } from "@/components/account-panel";
import { useLineHref } from "@/components/line-switcher";

/**
 * A tap on the store name or the Start tab. Already on the home page: no navigation, a smooth scroll to the very top
 * (instant with reduced motion). Elsewhere: the home page of this language, opened at the top; the router's own
 * scroll would stop below the message bar, so the link scrolls to 0 itself. An open account menu closes either way.
 * Focus then goes to the page content (FocusOnNavigate), so a tap leaves no ring.
 */
export function goHome(e: React.MouseEvent, href: string) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab or window
  dropAccountPanel();
  const to = new URL(href, window.location.href);
  if (to.pathname === window.location.pathname && to.search === window.location.search) {
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

/** The store name in the header (see goHome). */
export function HomeLink({
  href,
  className,
  translate,
  children,
}: {
  href: string;
  className?: string;
  translate?: "no";
  children: ReactNode;
}) {
  const to = useLineHref()(href); // the chosen part of the store (?line=) stays
  return (
    <Link href={to} scroll={false} onClick={(e) => goHome(e, to)} translate={translate} className={className}>
      {children}
    </Link>
  );
}
