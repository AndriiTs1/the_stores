"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Faders, X } from "@phosphor-icons/react";
import { StableText } from "@/components/stable-text";
import { Select } from "@/components/ui/select";
import { filterCount, listingHref, matchesFilters, NO_FILTERS, SORTS, type Filters, type Sort } from "@/lib/filters";
import type { ListingFacets } from "@/lib/listing";
import { formatMoney } from "@/lib/money";

export type FilterLabels = {
  filter: string;
  /** "Filter" in every language of the store: the button keeps its width when the language changes. */
  filterVariants: string[];
  sort: string;
  sorts: Record<Sort, string>;
  size: string;
  price: string;
  priceFrom: string;
  priceTo: string;
  onlySale: string;
  brand: string;
  color: string;
  /** "{n} Artikel anzeigen" for one / for other counts. */
  showOne: string;
  showOther: string;
  reset: string;
  resetAll: string;
  close: string;
  removeFilter: string;
  fromPrice: string;
  upToPrice: string;
};

const subscribeNothing = () => () => {};
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The line above a listing: Filter (with the number chosen) on the left, the sort order on the right; on phones it
 * sticks under the header while the page scrolls. Below it the chosen filters as pills with a cross, and "clear all".
 * Filter opens the same panel everywhere: a sheet from the bottom on phones, a panel from the right from md.
 * Everything lives in the address (?size=M&sort=…), so Back restores it; the panel's count follows each choice
 * at once, worked out from every product of the listing (matchesFilters, the rules the server applies).
 */
export function FilterBar({
  path,
  filters,
  facets,
  locale,
  currency,
  labels,
}: {
  /** The listing without filters (it may carry its own query). */
  path: string;
  filters: Filters;
  facets: ListingFacets;
  locale: string;
  currency: string;
  labels: FilterLabels;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const count = filterCount(filters);
  const go = (f: Filters) => router.push(listingHref(path, { ...f, page: 1 }), { scroll: false });
  const money = (rappen: number) => formatMoney(rappen, locale, currency);

  // Chosen filters as pills: each links to the listing without that value.
  const pills: { key: string; label: string; href: string }[] = [
    ...filters.sizes.map((s) => ({
      key: `size-${s}`,
      label: facets.sizes.find((o) => o.value === s)?.label ?? s,
      href: listingHref(path, { ...filters, sizes: filters.sizes.filter((x) => x !== s), page: 1 }),
    })),
    ...(filters.min != null || filters.max != null
      ? [
          {
            key: "price",
            label:
              filters.min != null && filters.max != null
                ? `${money(filters.min)} – ${money(filters.max)}`
                : filters.min != null
                  ? labels.fromPrice.replace("{x}", money(filters.min))
                  : labels.upToPrice.replace("{x}", money(filters.max!)),
            href: listingHref(path, { ...filters, min: null, max: null, page: 1 }),
          },
        ]
      : []),
    ...(filters.sale
      ? [{ key: "sale", label: labels.onlySale, href: listingHref(path, { ...filters, sale: false, page: 1 }) }]
      : []),
    ...filters.brands.map((b) => ({
      key: `brand-${b}`,
      label: facets.brands.find((o) => o.value === b)?.label ?? b,
      href: listingHref(path, { ...filters, brands: filters.brands.filter((x) => x !== b), page: 1 }),
    })),
    ...filters.colors.map((c) => ({
      key: `color-${c}`,
      label: facets.colors.find((o) => o.value === c)?.label ?? c,
      href: listingHref(path, { ...filters, colors: filters.colors.filter((x) => x !== c), page: 1 }),
    })),
  ];

  return (
    <>
      {/* Phones: sticks right under the header (its height is --header-h, set by HeaderHeight). */}
      <div className="sticky top-[var(--header-h,0px)] z-30 -mx-4 flex items-center justify-between gap-3 bg-background px-4 py-2 sm:-mx-6 sm:px-6 md:static md:mx-0 md:px-0">
        <button
          ref={button}
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#d6d6d2] px-4 text-sm font-medium hover:border-meta"
        >
          <Faders aria-hidden size={18} />
          <span>
            <StableText text={labels.filter} variants={labels.filterVariants} />
            {count > 0 && ` (${count})`}
          </span>
        </button>
        <Select
          aria-label={labels.sort}
          value={filters.sort}
          onValueChange={(sort) => go({ ...filters, sort: sort as Sort })}
          options={SORTS.map((s) => ({ value: s, label: labels.sorts[s] }))}
          // A fixed width: a longer label (another language, another order) doesn't move anything.
          className="w-48 md:w-56"
        />
      </div>

      {pills.length > 0 && (
        <ul className="mt-2 flex flex-wrap items-center gap-2">
          {pills.map((p) => (
            <li key={p.key}>
              <Link
                href={p.href}
                scroll={false}
                aria-label={labels.removeFilter.replace("{x}", p.label)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-field px-3 text-sm hover:bg-[#e9e9e6]"
              >
                {p.label}
                <X aria-hidden size={14} weight="bold" />
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={listingHref(path, { ...NO_FILTERS, sort: filters.sort })}
              scroll={false}
              className="ml-1 rounded text-sm font-medium underline underline-offset-4"
            >
              {labels.resetAll}
            </Link>
          </li>
        </ul>
      )}

      <FilterSheet
        open={open}
        onClose={() => {
          setOpen(false);
          button.current?.focus();
        }}
        onApply={(f) => {
          setOpen(false);
          go(f);
          button.current?.focus();
        }}
        filters={filters}
        facets={facets}
        locale={locale}
        currency={currency}
        labels={labels}
      />
    </>
  );
}

/** "20" or "19.90" → Rappen; "" → no bound; null while the text isn't a price. */
function parsePrice(text: string): number | null | undefined {
  const t = text.trim().replace(",", ".");
  if (t === "") return null;
  return /^\d{1,6}(\.\d{1,2})?$/.test(t) ? Math.round(Number(t) * 100) : undefined;
}
const priceText = (rappen: number | null) => (rappen == null ? "" : String(rappen / 100));

function FilterSheet({
  open,
  onClose,
  onApply,
  filters,
  facets,
  locale,
  currency,
  labels,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (f: Filters) => void;
  filters: Filters;
  facets: ListingFacets;
  locale: string;
  currency: string;
  labels: FilterLabels;
}) {
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState(filters);
  const [minText, setMinText] = useState(priceText(filters.min));
  const [maxText, setMaxText] = useState(priceText(filters.max));

  // Each opening starts from the filters in the address.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraft(filters);
      setMinText(priceText(filters.min));
      setMaxText(priceText(filters.max));
    }
  }

  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden"; // the page behind doesn't scroll
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const firstItem = items[0];
    const last = items.at(-1);
    if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === panel.current)) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      firstItem?.focus();
    }
  };

  const toggle = (key: "sizes" | "brands" | "colors", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }));
  const setPrice = (bound: "min" | "max", text: string) => {
    (bound === "min" ? setMinText : setMaxText)(text);
    const value = parsePrice(text);
    if (value !== undefined) setDraft((d) => ({ ...d, [bound]: value }));
  };

  const matching = facets.products.filter((p) => matchesFilters(p, draft)).length;
  const range = facets.priceRange;
  const money = (rappen: number) => formatMoney(rappen, locale, currency);

  if (!mounted) return null;
  return createPortal(
    <div
      inert={!open}
      className={`fixed inset-0 z-50 overflow-hidden ${
        open ? "visible" : "pointer-events-none invisible transition-[visibility] duration-200 motion-reduce:transition-none"
      }`}
    >
      <div
        aria-hidden
        onClick={onClose}
        className={`absolute inset-0 bg-foreground/40 transition-opacity duration-200 motion-reduce:transition-none ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-background shadow-xl transition-transform duration-200 ease-out motion-reduce:transition-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[400px] md:rounded-none ${
          open ? "translate-x-0 translate-y-0" : "translate-y-full md:translate-x-full md:translate-y-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-divider pl-4 pr-1.5">
          <h2 id={titleId} className="text-lg font-black tracking-tight">
            {labels.filter}
          </h2>
          <button
            type="button"
            aria-label={labels.close}
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-full"
          >
            <X aria-hidden size={22} />
          </button>
        </div>

        <div className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-4">
          {facets.sizes.length >= 2 && (
            <Group title={labels.size}>
              <div className="flex flex-wrap gap-2">
                {facets.sizes.map((o) => (
                  <Chip key={o.value} on={draft.sizes.includes(o.value)} onClick={() => toggle("sizes", o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </Group>
          )}
          {range && range[0] < range[1] && (
            <Group title={labels.price}>
              <div className="flex items-end gap-3">
                {(["min", "max"] as const).map((bound) => (
                  <label key={bound} className="min-w-0 flex-1">
                    <span className="label">{bound === "min" ? labels.priceFrom : labels.priceTo}</span>
                    <input
                      inputMode="decimal"
                      autoComplete="off"
                      value={bound === "min" ? minText : maxText}
                      placeholder={money(bound === "min" ? range[0] : range[1])}
                      onChange={(e) => setPrice(bound, e.target.value)}
                      aria-invalid={parsePrice(bound === "min" ? minText : maxText) === undefined || undefined}
                      className="input text-base!"
                    />
                  </label>
                ))}
              </div>
            </Group>
          )}
          {facets.sale && (
            <Group>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                {labels.onlySale}
                <input
                  type="checkbox"
                  checked={draft.sale}
                  onChange={(e) => setDraft((d) => ({ ...d, sale: e.target.checked }))}
                  className="size-5 accent-[var(--foreground)]"
                />
              </label>
            </Group>
          )}
          {facets.brands.length >= 2 && (
            <Group title={labels.brand}>
              <ul className="space-y-1">
                {facets.brands.map((o) => (
                  <li key={o.value}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={draft.brands.includes(o.value)}
                        onChange={() => toggle("brands", o.value)}
                        className="size-5 accent-[var(--foreground)]"
                      />
                      {o.label}
                    </label>
                  </li>
                ))}
              </ul>
            </Group>
          )}
          {facets.colors.length >= 2 && (
            <Group title={labels.color}>
              <div className="flex flex-wrap gap-2">
                {facets.colors.map((o) => (
                  <Chip key={o.value} on={draft.colors.includes(o.value)} onClick={() => toggle("colors", o.value)}>
                    {o.label}
                  </Chip>
                ))}
              </div>
            </Group>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-divider p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              setDraft({ ...NO_FILTERS, sort: draft.sort });
              setMinText("");
              setMaxText("");
            }}
            className="btn btn-ghost h-11 py-0"
          >
            {labels.reset}
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="btn btn-accent h-11 min-w-0 flex-1 py-0"
          >
            <span className="truncate">
              {(new Intl.PluralRules(locale).select(matching) === "one" ? labels.showOne : labels.showOther).replace(
                "{n}",
                String(matching),
              )}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="py-4">
      {title && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-meta">{title}</h3>}
      {children}
    </section>
  );
}

/** A choice that toggles: a dark 1.5px outline when chosen (no fill), the same size either way. */
function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`inline-flex h-10 min-w-12 items-center justify-center rounded-full border px-4 text-sm font-medium ${
        on ? "border-transparent shadow-[inset_0_0_0_1.5px_var(--foreground)]" : "border-[#d6d6d2] hover:border-meta"
      }`}
    >
      {children}
    </button>
  );
}
