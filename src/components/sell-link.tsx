import Link from "next/link";

/** Outline plus, 2px stroke at any size (the "Sell" circle in the bottom bar, the header button). */
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
 * Header button to the sell page (from md; phones have the raised bar button): red outline and text, no fill.
 * The 1.5px edge is a 1px border plus a 0.5px inset shadow (Chrome draws a 1.5px border as 1px). Only the fill
 * transitions: transition-colors would also fade the focus outline in from red.
 */
export function SellHeaderLink({ href, label, ariaLabel }: { href: string; label: string; ariaLabel: string }) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="hidden h-10 shrink-0 items-center gap-1.5 rounded-md border border-accent px-3.5 text-sm font-bold text-accent shadow-[inset_0_0_0_0.5px_var(--accent)] transition-[background-color] hover:bg-[rgb(200_16_46/0.06)] md:inline-flex"
    >
      <PlusIcon aria-hidden size={18} />
      {label}
    </Link>
  );
}
