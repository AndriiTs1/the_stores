"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react";
import { storePath } from "@/lib/storefront-tabs";
import { notifyHashChanged, pushHash, readHash, replaceHash, subscribeHash } from "@/lib/url-hash";

/**
 * The phone's account side panel is open while the URL ends in #account. Being in the URL it survives a
 * language change (the language links keep the hash, and the new language mounts a fresh layout), and the
 * back gesture closes it (opening adds a history entry). Going to another page closes it and removes #account
 * in place, so Back never reopens it.
 */
const HASH = "#account";

export function useAccountPanelOpen() {
  return useSyncExternalStore(subscribeHash, readHash, () => "") === HASH;
}

/** The history entry this page added when opening; closing goes back to the entry before it. */
let openedAt: string | null = null;

export function openAccountPanel() {
  pushHash(HASH);
  openedAt = window.location.href;
}

/** Back when we opened it here (no stray entry left behind), else drop the hash in place (e.g. after a language change). */
export function closeAccountPanel() {
  if (openedAt === window.location.href) window.history.back();
  else replaceHash("");
  openedAt = null;
}

/** Closes it in place, without a history step: for a link that leaves for another page or the top of this one. */
export function dropAccountPanel() {
  if (readHash() === HASH) replaceHash("");
  openedAt = null;
}

const subscribeNothing = () => () => {};
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Where focus goes on a new page: the start of its content (<main tabIndex={-1}> in the storefront layout). */
export const MAIN_ID = "main";

/**
 * Right-hand panel, 85% of the screen, over a dimmed page (phones only). A dialog: focus moves to the panel itself
 * (no ring: a tap must not show one; Tab then reaches the cross) and stays in while open (Tab wraps).
 * Esc / the cross / a tap on the dim layer close it and focus returns to `returnFocus`; a link to another page
 * closes it and focus starts at the new page's content.
 */
export function AccountPanel({
  id,
  open,
  title,
  closeLabel,
  returnFocus,
  base,
  children,
}: {
  id: string;
  open: boolean;
  title: string;
  closeLabel: string;
  returnFocus: RefObject<HTMLElement | null>;
  /** Store prefix of links ("/s/demo" or ""), to tell a page change from a language change. */
  base: string;
  children: ReactNode;
}) {
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  /** Set when a link in the panel leads away: focus then goes to the new page, not back to the Account button. */
  const leaving = useRef(false);

  // The page without store prefix and locale: "/info/rueckgabe". A language change keeps it (and the panel open).
  const page = storePath(usePathname(), base).replace(/^\/[^/]+/, "");
  const lastPage = useRef(page);
  useEffect(() => {
    if (lastPage.current === page) return;
    lastPage.current = page;
    // The router has written the new URL by now. A page reached with #account (Back to an old entry) is cleaned
    // in place; otherwise the hash store just learns the URL changed.
    if (readHash() === HASH) replaceHash("");
    else notifyHashChanged();
    if (leaving.current) {
      leaving.current = false;
      document.getElementById(MAIN_ID)?.focus({ preventScroll: true });
    }
  }, [page]);

  useEffect(() => {
    if (open) {
      panel.current?.focus({ preventScroll: true });
      const root = document.documentElement;
      const overflow = root.style.overflow;
      root.style.overflow = "hidden"; // the page behind doesn't scroll
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAccountPanel();
      document.addEventListener("keydown", onKey);
      wasOpen.current = true;
      return () => {
        root.style.overflow = overflow;
        document.removeEventListener("keydown", onKey);
      };
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      if (!leaving.current) returnFocus.current?.focus();
    }
  }, [open, returnFocus]);

  // A link to another page (not a language link: those keep #account): drop the hash in place before the router
  // pushes the new page, so Back returns to the page without the panel.
  const leaveByLink = (e: React.MouseEvent) => {
    const link = (e.target as Element).closest("a[href]");
    if (!(link instanceof HTMLAnchorElement) || new URL(link.href).hash === HASH) return;
    leaving.current = true;
    openedAt = null;
    replaceHash("");
  };

  // Tab and Shift+Tab wrap around inside the panel.
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  if (!mounted) return null;
  return createPortal(
    // Closing: visibility switches after the slide-out, so a closed panel is truly hidden. Opening: at once,
    // so focus can move into the panel right away. overflow-hidden: the closed panel waits off-screen to the right
    // and must not stick out past the screen edge.
    <div
      inert={!open}
      className={`fixed inset-0 z-50 overflow-hidden md:hidden ${
        open
          ? "visible"
          : "pointer-events-none invisible transition-[visibility] duration-200 motion-reduce:transition-none"
      }`}
    >
      <div
        aria-hidden
        onClick={closeAccountPanel}
        className={`absolute inset-0 bg-foreground/40 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panel}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        onClickCapture={leaveByLink}
        className={`absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-background shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-divider pl-4 pr-1.5">
          <h2 id={titleId} className="text-lg font-black tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={closeAccountPanel}
            className="inline-flex size-11 items-center justify-center rounded-full text-foreground"
          >
            <X aria-hidden size={22} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
