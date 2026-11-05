"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useLineHref } from "@/components/line-switcher";

/** `accent`: the Sale item, always red and bold (the only red in the menu). */
export type NavItem = { href: string; label: ReactNode; accent?: boolean };

/** Header navigation (the store's collections); the current page is marked with aria-current. */
export function StoreNav({
  items,
  label,
  className = "",
  linkClassName = "",
  onNavigate,
}: {
  items: NavItem[];
  label: string;
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const keepLine = useLineHref(); // the chosen part of the store (?line=) travels with the menu
  return (
    <nav aria-label={label} className={className}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={keepLine(item.href)}
          aria-current={pathname === item.href ? "page" : undefined}
          onClick={onNavigate}
          className={`${linkClassName} ${item.accent ? "font-bold! text-accent" : ""}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
