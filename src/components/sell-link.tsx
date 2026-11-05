import Link from "next/link";
import type { ReactNode } from "react";

/** Outline plus, 2px stroke at any size (the header "Sell" button). */
export function PlusIcon({ size = 24, "aria-hidden": ariaHidden }: { size?: number; "aria-hidden"?: boolean }) {
  return (
    <svg
      aria-hidden={ariaHidden}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    >
      <path d={`M${size / 2} ${size * 0.2}V${size * 0.8}M${size * 0.2} ${size / 2}H${size * 0.8}`} />
    </svg>
  );
}

/**
 * Header button to the sell page (from md; phones have the bar tab): a light 1px outline, black text, no fill;
 * hover darkens the edge and adds the grey field fill. Only border and fill transition: transition-colors would
 * also animate the focus outline's colour.
 */
export function SellHeaderLink({ href, label, ariaLabel }: { href: string; label: ReactNode; ariaLabel: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="hidden h-10 shrink-0 items-center gap-1.5 rounded-md border border-[#d6d6d2] px-3.5 text-sm font-medium text-foreground transition-[border-color,background-color] hover:border-meta hover:bg-field md:inline-flex"
    >
      <PlusIcon aria-hidden size={18} />
      {label}
    </Link>
  );
}
