"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType, type ReactNode } from "react";
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

/** Bar height above the safe area; the storefront body pads itself by this much. */
export const BAR_HEIGHT = 56;
/** Popups sit 8px above the bar's top edge (bar items fill its full height). */
export const BAR_POPUP_OFFSET = 8;

export type BottomBarItem = {
  id: string;
  /** Visible label under the icon. */
  label: string;
  icon: ComponentType<{ size?: number; weight?: IconWeight; "aria-hidden"?: boolean }>;
  href?: string;
  active?: boolean;
  /** A control that brings its own button (e.g. the language picker). */
  render?: () => ReactNode;
};

/** Every bar item: icon over an 11px label, the full bar height, no tap highlight. Colour: see barItemColor. */
export const barItemClass =
  "inline-flex h-14 w-full min-w-0 flex-col items-center justify-center gap-1 rounded [-webkit-tap-highlight-color:transparent]";
/** Grey, dark while pressed; red when active. */
export const barItemColor = (active: boolean) => (active ? "text-accent" : "text-meta active:text-foreground");

/** Icon and label of a bar item. */
export function BarItemFace({ icon: Icon, label }: { icon: BottomBarItem["icon"]; label: string }) {
  return (
    <>
      <Icon aria-hidden size={22} />
      <span className="max-w-full truncate px-1 text-[11px] leading-none">{label}</span>
    </>
  );
}

/**
 * Phone-only bar (< md): white, full width, pinned to the bottom above the iPhone safe area, a 1px line on top.
 * Equal columns of outline icons with labels; the active one red. Hidden (fade + slide down) on checkout and
 * while typing.
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
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, height: BAR_HEIGHT }}>
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 items-center justify-center">
            {item.render ? (
              item.render()
            ) : (
              <Link
                href={item.href ?? "#"}
                aria-current={item.active ? "page" : undefined}
                className={`${barItemClass} ${barItemColor(!!item.active)}`}
              >
                <BarItemFace icon={item.icon} label={item.label} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
