"use client";

import { List, X } from "@phosphor-icons/react";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import { LanguageButtons, LanguageButtonsFallback } from "@/components/language-picker";
import { StoreNav, type NavItem } from "@/components/store-nav";

/**
 * Burger menu below lg: the navigation and the languages in a panel under the header.
 * Closes on a link, Escape or a press outside.
 */
export function MobileMenu({
  items,
  locales,
  current,
  base,
  labels,
  className = "",
}: {
  items: NavItem[];
  locales: string[];
  current: string;
  base: string;
  labels: { menu: string; close: string; nav: string; language: string };
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={root} className={className}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.menu}
        onClick={() => setOpen((o) => !o)}
        className="-ml-2 inline-flex size-11 items-center justify-center rounded-full"
      >
        {open ? <X aria-hidden size={22} weight="bold" /> : <List aria-hidden size={22} weight="bold" />}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-background shadow-lg"
      >
        <div className="container-page space-y-4 py-4">
          <StoreNav
            items={items}
            label={labels.nav}
            onNavigate={close}
            className="flex flex-col"
            linkClassName="rounded py-2.5 text-lg font-semibold aria-[current=page]:text-accent"
          />
          {/* Language codes are never machine-translated. */}
          <div translate="no" className="border-t border-line pt-4" onClick={close}>
            <p className="label">{labels.language}</p>
            <Suspense fallback={<LanguageButtonsFallback locales={locales} current={current} base={base} />}>
              <LanguageButtons locales={locales} current={current} base={base} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
