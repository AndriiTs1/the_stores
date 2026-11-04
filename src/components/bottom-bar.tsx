"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType } from "react";
import type { IconWeight } from "@phosphor-icons/react";

/** On a phone the on-screen keyboard shrinks the visual viewport; hide the bar meanwhile. */
const subscribeViewport = (cb: () => void) => {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", cb);
  window.addEventListener("resize", cb);
  return () => {
    vv?.removeEventListener("resize", cb);
    window.removeEventListener("resize", cb);
  };
};
const keyboardOpen = () => {
  const vv = window.visualViewport;
  return !!vv && window.innerHeight - vv.height > 150;
};

export type BottomBarItem = {
  id: string;
  /** Visible label under the icon. */
  label: string;
  icon: ComponentType<{ size?: number; weight?: IconWeight; "aria-hidden"?: boolean }>;
  href: string;
  active?: boolean;
  /** Red counter on the icon; hidden at 0. */
  badge?: number;
  /** Accessible name when the badge needs words (e.g. "Wishlist, 2 items"); else the label. */
  ariaLabel?: string;
};

/**
 * Phone-only bar (< md): white, full width, pinned to the bottom above the iPhone safe area, a 1px line on top.
 * Equal columns, each the full bar height (56px): an outline icon over an 11px label, grey, the active one red.
 * Hidden (fade + slide down) on checkout and while typing.
 */
export function BottomBar({ items }: { items: BottomBarItem[] }) {
  const pathname = usePathname();
  const typing = useSyncExternalStore(subscribeViewport, keyboardOpen, () => false);
  const hidden = /\/checkout(\/|$)/.test(pathname) || typing;

  return (
    <nav
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-background pb-[env(safe-area-inset-bottom)] transition-[opacity,transform,visibility] duration-[180ms] ease-out motion-reduce:transition-none md:hidden ${
        hidden ? "invisible translate-y-4 opacity-0" : "visible translate-y-0 opacity-100"
      }`}
    >
      <ul className="grid h-14" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ id, label, icon: Icon, href, active = false, badge = 0, ariaLabel }) => (
          <li key={id} className="flex min-w-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={ariaLabel}
              className={`flex h-14 w-full min-w-0 flex-col items-center justify-center gap-1 rounded [-webkit-tap-highlight-color:transparent] ${
                active ? "text-accent" : "text-meta active:text-foreground"
              }`}
            >
              <span className="relative">
                <Icon aria-hidden size={22} />
                {badge > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none tabular-nums text-accent-ink"
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              {/* Long words (e.g. "Catégories") shrink to an ellipsis instead of widening the column. */}
              <span className="max-w-full truncate px-1 text-[11px] leading-none">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
