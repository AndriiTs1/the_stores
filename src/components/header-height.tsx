"use client";

import { useEffect } from "react";

/**
 * Keeps --header-h on <html> equal to the sticky header's height (it changes with the breakpoint and when the
 * phone header wraps), so a bar can stick right under it (the listing's filter line).
 */
export function HeaderHeight() {
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${header.offsetHeight}px`);
    set();
    const observer = new ResizeObserver(set);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return null;
}
