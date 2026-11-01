"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import * as Popover from "@radix-ui/react-popover";
import { usePressToggle } from "@/components/ui/use-press-toggle";
import { LANGUAGE_NAMES } from "@/lib/i18n";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, switchLocaleHref } from "@/lib/locale-path";

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

/** href of the current page in another language: only the locale segment changes, query and #hash stay. */
function useLocaleHref(base: string) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => "",
  );
  const here = `${pathname}${search ? `?${search}` : ""}${hash}`;
  return (locale: string) => switchLocaleHref(here, base, locale);
}

const remember = (locale: string) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
};

/**
 * Phone bottom bar: globe icon button + a capsule of language circles above it, exactly as wide as the
 * button and centred on it. (From md the header shows LanguageButtons instead.)
 * Same press handling as our Select: toggle on the button, outside press closes without clicking through.
 */
export function LanguagePicker({
  locales,
  current,
  base,
  buttonLabel,
  onOpenChange,
  icon,
  triggerClassName,
  sideOffset = 8,
}: {
  locales: string[];
  current: string;
  base: string;
  /** e.g. "Sprache: {name}" */
  buttonLabel: string;
  /** Lets the bottom bar keep only one popup open (closes a "coming soon" hint). */
  onOpenChange?: (open: boolean) => void;
  /** Icon inside the round button (the dock passes a white Phosphor globe). */
  icon: (open: boolean) => ReactNode;
  triggerClassName: string;
  /** Distance from the button to the capsule; the dock uses it to sit 8px above the dock's edge. */
  sideOffset?: number;
}) {
  const router = useRouter();
  const hrefFor = useLocaleHref(base);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (i: number) => `${listId}-o${i}`;
  const currentIndex = Math.max(0, locales.indexOf(current));

  const show = () => {
    setActive(currentIndex);
    setOpen(true);
    onOpenChange?.(true);
  };
  const close = () => {
    setOpen(false);
    onOpenChange?.(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  const choose = (i: number) => {
    const l = locales[i];
    close();
    if (!l || l === current) return;
    remember(l);
    router.push(hrefFor(l), { scroll: false });
  };
  const { triggerRef, contentRef, triggerProps } = usePressToggle({ open, onShow: show, onClose: close });

  const onListKeyDown = (e: React.KeyboardEvent) => {
    const last = locales.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      setActive(Math.min(last, Math.max(0, i)));
    };
    if (e.key === "ArrowDown") move(active + 1);
    else if (e.key === "ArrowUp") move(active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(last);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Tab") {
      e.preventDefault();
      close();
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={(o) => (o ? show() : close())} modal={false}>
      <Popover.Anchor asChild>
        <button
          ref={triggerRef}
          type="button"
          aria-label={buttonLabel.replace("{name}", LANGUAGE_NAMES[current] ?? current)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          data-state={open ? "open" : "closed"}
          {...triggerProps}
          onKeyDown={(e) => {
            if (!open && ["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault();
              show();
            }
          }}
          // Icon only: no border, background or tap highlight; round keyboard focus ring (focus-visible).
          className={triggerClassName}
        >
          {icon(open)}
        </button>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          side="top"
          align="center"
          sideOffset={sideOffset}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            listRef.current?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={(e) => e.preventDefault()} // focus is returned by close()
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            close();
          }}
          onPointerDownOutside={(e) => e.preventDefault()} // handled by usePressToggle
          className="z-50 w-[var(--radix-popover-trigger-width)] origin-bottom motion-safe:animate-[picker-in_150ms_ease-out]"
        >
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={buttonLabel.replace("{name}", "").replace(/[\s:]+$/, "")}
            aria-activedescendant={optionId(active)}
            onKeyDown={onListKeyDown}
            className="flex flex-col items-center gap-1 rounded-full border border-line bg-background py-1 shadow-md outline-none"
          >
            {locales.map((l, i) => (
              <li
                key={l}
                id={optionId(i)}
                role="option"
                lang={l}
                aria-label={LANGUAGE_NAMES[l] ?? l}
                aria-selected={l === current}
                data-highlighted={i === active || undefined}
                onPointerDown={(e) => e.preventDefault()} // keep focus in the list
                onPointerMove={(e) => e.pointerType === "mouse" && setActive(i)}
                onClick={() => choose(i)} // click: a finger that scrolled never selects
                className={`flex size-10 cursor-default select-none items-center justify-center rounded-full text-xs font-semibold uppercase ${
                  l === current
                    ? "bg-foreground text-background"
                    : "text-muted hover:bg-surface data-[highlighted]:bg-surface data-[highlighted]:text-foreground"
                }`}
              >
                {l}
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

/**
 * From md, in the header: DE FR IT EN in a grey pill, fixed 32px buttons, the active one black.
 * Links to the same page in that language (no scroll to top), remembered in the NEXT_LOCALE cookie.
 */
export function LanguageButtons({ locales, current, base }: { locales: string[]; current: string; base: string }) {
  const hrefFor = useLocaleHref(base);
  return <LanguageButtonRow locales={locales} current={current} hrefFor={hrefFor} />;
}

/** Server fallback while useSearchParams suspends: same look, links to each language's store root. */
export function LanguageButtonsFallback({
  locales,
  current,
  base,
}: {
  locales: string[];
  current: string;
  base: string;
}) {
  return <LanguageButtonRow locales={locales} current={current} hrefFor={(l) => `${base}/${l}`} />;
}

function LanguageButtonRow({
  locales,
  current,
  hrefFor,
}: {
  locales: string[];
  current: string;
  hrefFor: (l: string) => string;
}) {
  return (
    <div className="flex rounded-full bg-surface p-1">
      {locales.map((l) => (
        <Link
          key={l}
          href={hrefFor(l)}
          hrefLang={l}
          lang={l}
          scroll={false}
          aria-label={LANGUAGE_NAMES[l] ?? l}
          aria-current={l === current ? "true" : undefined}
          onClick={() => remember(l)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold uppercase ${
            l === current ? "bg-foreground text-background" : "text-muted hover:text-foreground"
          }`}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
