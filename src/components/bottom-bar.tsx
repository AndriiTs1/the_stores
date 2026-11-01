"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { IconWeight } from "@phosphor-icons/react";

/** On a phone the on-screen keyboard shrinks the visual viewport; hide the dock meanwhile. */
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

/** Dock geometry: 56px high, 12px from the screen edges (+ safe area below). */
export const DOCK_HEIGHT = 56;
export const DOCK_GAP = 12;
/** Popups sit 8px above the dock's top edge; buttons are 48px in a 56px dock, so 4px lower than that edge. */
export const DOCK_POPUP_OFFSET = 8 + (DOCK_HEIGHT - 48) / 2;

export type BottomBarItem = {
  id: string;
  /** Accessible name (icons only, no visible text). */
  label: string;
  icon: ComponentType<{ size?: number; weight?: IconWeight; "aria-hidden"?: boolean }>;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  /** A control that brings its own button (e.g. the language picker). */
  render?: () => ReactNode;
};

/** Every dock button: icon only, no border/background/tap highlight; focus ring comes from --ring (white). */
export const dockButtonClass =
  "relative z-10 inline-flex size-12 items-center justify-center rounded-full [-webkit-tap-highlight-color:transparent]";

/**
 * Phone-only floating black dock (< md), in pair with the black cart circle in the header.
 * Equal columns; the active item sits on a white 42px circle that slides between columns.
 * `hint` shows a small bubble above one item. Hidden (fade + slide down) on checkout and while typing.
 */
export function BottomBar({
  items,
  hint,
  onHintDismiss,
}: {
  items: BottomBarItem[];
  hint?: { id: string; text: string } | null;
  onHintDismiss?: () => void;
}) {
  const pathname = usePathname();
  const typing = useSyncExternalStore(subscribeViewport, keyboardOpen, () => false);
  const hidden = /\/checkout(\/|$)/.test(pathname) || typing;
  const activeIndex = items.findIndex((i) => i.active);

  return (
    <nav
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={`fixed z-40 rounded-[28px] bg-foreground shadow-lg [--ring:#fff] transition-[opacity,transform,visibility] duration-[180ms] ease-out motion-reduce:transition-none md:hidden ${
        hidden ? "invisible translate-y-4 opacity-0" : "visible translate-y-0 opacity-100"
      }`}
      style={{
        left: DOCK_GAP,
        right: DOCK_GAP,
        bottom: `calc(${DOCK_GAP}px + env(safe-area-inset-bottom))`,
        height: DOCK_HEIGHT,
      }}
    >
      <ul className="relative grid h-full" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {/* One column wide; translateX by whole columns moves the white circle under the active item. */}
        <li
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center transition-transform duration-[220ms] ease-out motion-reduce:transition-none ${
            activeIndex < 0 ? "opacity-0" : ""
          }`}
          style={{ width: `${100 / items.length}%`, transform: `translateX(${Math.max(0, activeIndex) * 100}%)` }}
        >
          <span className="size-[42px] rounded-full bg-background" />
        </li>
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-center">
            {item.render ? (
              item.render()
            ) : (
              <DockButton item={item} hint={hint?.id === item.id ? hint.text : null} onHintDismiss={onHintDismiss} />
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DockButton({
  item,
  hint,
  onHintDismiss,
}: {
  item: BottomBarItem;
  hint: string | null;
  onHintDismiss?: () => void;
}) {
  const Icon = item.icon;
  const className = `${dockButtonClass} ${item.active ? "text-foreground" : "text-white/75"}`;
  const icon = <Icon aria-hidden size={22} weight={item.active ? "fill" : "bold"} />;

  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={item.active ? "page" : undefined}
        className={className}
      >
        {icon}
      </Link>
    );
  }

  return (
    <Popover.Root open={hint != null} onOpenChange={(o) => !o && onHintDismiss?.()} modal={false}>
      <Popover.Anchor asChild>
        <button type="button" aria-label={item.label} onClick={item.onClick} className={className}>
          {icon}
        </button>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="center"
          sideOffset={DOCK_POPUP_OFFSET}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          role="status"
          className="z-50 origin-bottom whitespace-nowrap rounded-full border border-line bg-background px-3 py-2 text-xs font-medium shadow-md motion-safe:animate-[picker-in_150ms_ease-out]"
        >
          {hint}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
