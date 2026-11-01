"use client";

import Link from "next/link";
import { IconShoppingBag } from "@tabler/icons-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

/**
 * Header cart counter. The server renders the count from the cookie; the cart page
 * overrides it with its optimistic count so the header changes on every +/− at once.
 */
const CartCountContext = createContext<{
  server: number;
  override: number | null;
  setOverride: (n: number | null) => void;
}>({ server: 0, override: null, setOverride: () => {} });

export function CartCountProvider({ count, children }: { count: number; children: React.ReactNode }) {
  const [override, setOverride] = useState<number | null>(null);
  return (
    <CartCountContext.Provider value={{ server: count, override, setOverride }}>{children}</CartCountContext.Provider>
  );
}

/**
 * Black 40px circle with a white bag, inside a 44×44 tap area; red badge top-right, hidden at 0, "99+" above 99.
 * aria-label in the page language with the right plural form (Intl.PluralRules: fr 0 and 1 are "one").
 * The badge pulses briefly when the count changes (only if the user allows motion).
 */
export function CartButton({
  href,
  locale,
  labels,
}: {
  href: string;
  locale: string;
  labels: { one: string; other: string };
}) {
  const { server, override } = useContext(CartCountContext);
  const n = override ?? server;
  const label = (new Intl.PluralRules(locale).select(n) === "one" ? labels.one : labels.other).replace(
    "{n}",
    String(n),
  );

  const badge = useRef<HTMLSpanElement>(null);
  const previous = useRef(n);
  useEffect(() => {
    if (previous.current === n) return;
    previous.current = n;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    badge.current?.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)" }, { transform: "scale(1)" }], {
      duration: 200,
      easing: "ease-out",
    });
  }, [n]);

  return (
    <Link
      href={href}
      aria-label={label}
      className="group relative inline-flex size-11 items-center justify-center rounded-full"
    >
      {/* Badge is positioned against the 40px circle (top −4px, right −6px), not the 44px tap area. */}
      <span className="relative inline-flex size-10 items-center justify-center rounded-full bg-foreground text-background transition group-hover:opacity-85">
        <IconShoppingBag aria-hidden size={20} stroke={1.75} />
        <span
          ref={badge}
          aria-hidden
          className={`absolute -right-1.5 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none tabular-nums text-accent-ink ${
            n > 0 ? "inline-flex" : "hidden"
          }`}
        >
          {n > 99 ? "99+" : n}
        </span>
      </span>
    </Link>
  );
}

/** Show `count` in the header while the calling component is mounted. */
export function useCartCountOverride(count: number) {
  const { setOverride } = useContext(CartCountContext);
  useEffect(() => {
    setOverride(count);
  }, [count, setOverride]);
  useEffect(() => () => setOverride(null), [setOverride]);
}
