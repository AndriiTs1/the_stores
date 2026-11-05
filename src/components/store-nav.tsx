"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

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
  return (
    <nav aria-label={label} className={className}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? "page" : undefined}
          onClick={onNavigate}
          className={linkClassName}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
