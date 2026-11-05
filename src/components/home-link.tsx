"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { dropAccountPanel } from "@/components/account-panel";

/**
 * The store name in the header: always the home page of this language, from its very top, also when already on it.
 * Scrolls to 0 itself (the router's own scroll stops below the message bar) and closes an open account menu.
 * Focus then goes to the page content (FocusOnNavigate), so a tap leaves no ring on the name.
 */
export function HomeLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const onClick = (e: React.MouseEvent) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab or window
    dropAccountPanel();
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <Link href={href} scroll={false} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}
