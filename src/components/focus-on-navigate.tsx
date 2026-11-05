"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MAIN_ID } from "@/components/account-panel";

const focusMain = () => document.getElementById(MAIN_ID)?.focus({ preventScroll: true });

/**
 * After a move to another page, focus starts at the new page's content (<main tabIndex={-1}>, never ringed).
 * Without this, Chrome leaves focus on the tapped link (the logo, a bar tab), which outlives the navigation as the
 * header and bar stay mounted; the next key press (Esc, Shift) then turns it :focus-visible and it gets the ring.
 * A link to the page already open (the logo on the home page) does the same.
 */
export function FocusOnNavigate() {
  const pathname = usePathname();
  const last = useRef(pathname);

  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    if (!document.activeElement?.closest('[role="dialog"]')) focusMain(); // the account panel handles its own
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.closest('[role="dialog"]')) return;
      const to = new URL(link.href);
      const here = window.location;
      if (to.origin === here.origin && to.pathname === here.pathname && to.search === here.search && !to.hash) {
        setTimeout(focusMain); // after the browser has focused the link
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
