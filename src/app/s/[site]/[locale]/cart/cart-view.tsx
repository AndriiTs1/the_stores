"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { useCartCountOverride } from "@/components/cart-count";
import { QuantityStepper } from "@/components/quantity-stepper";
import { OrderSummary } from "@/components/order-summary";
import type { CartLine } from "@/lib/cart";
import { optionLabel, type Dict } from "@/lib/i18n";
import { computeCart, formatMoney } from "@/lib/money";
import type { CartState } from "../actions";

const TYPING_DELAY = 400;
const BUTTON_DELAY = 300; // a burst of +/− clicks sends one request with the final value

const maxFor = (l: CartLine) => Math.max(1, Math.min(99, l.available));

export function CartView({
  initialLines,
  locale,
  base,
  currency,
  pricing,
  d,
  update,
  formAction,
}: {
  initialLines: CartLine[];
  locale: string;
  base: string;
  currency: string;
  pricing: { shippingFlat: number; freeShippingFrom: number | null; vatRateBp: number };
  d: Dict;
  update: (input: { variantId: string; quantity: number }) => Promise<CartState>;
  formAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  // `lines` = last state confirmed by the server; `draft` = quantities changed on screen but not confirmed yet.
  const [lines, setLines] = useState(initialLines);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlight = useRef(new Set<Promise<void>>());
  const lastSent = useRef(0);

  const shown = lines
    .filter((l) => draft[l.variantId] !== 0)
    .map((l) => {
      const quantity = draft[l.variantId] ?? l.quantity;
      return { ...l, quantity, lineTotal: l.unitPrice * quantity };
    });
  const totals = computeCart(shown, pricing);
  useCartCountOverride(totals.count);

  const send = (variantId: string, quantity: number) => {
    timers.current.delete(variantId);
    const seq = ++lastSent.current;
    const done = new Promise<void>((resolve) => {
      startTransition(async () => {
        try {
          const res = await update({ variantId, quantity });
          // Only the newest request's answer is applied; it already contains every earlier change.
          if (seq !== lastSent.current) return;
          setLines(res.lines);
          // Keep drafts only for lines with a change still waiting in its debounce timer.
          setDraft((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => timers.current.has(id))));
        } finally {
          resolve();
        }
      });
    });
    inFlight.current.add(done);
    done.then(() => inFlight.current.delete(done));
  };

  const setQuantity = (line: CartLine, quantity: number, delay: number) => {
    const q = quantity === 0 ? 0 : Math.min(maxFor(line), Math.max(1, quantity));
    setDraft((prev) => ({ ...prev, [line.variantId]: q }));
    clearTimeout(timers.current.get(line.variantId));
    if (delay === 0) send(line.variantId, q);
    else
      timers.current.set(
        line.variantId,
        setTimeout(() => send(line.variantId, q), delay),
      );
  };

  /** Send waiting changes now and wait for the server (before leaving for checkout). */
  const flush = async () => {
    for (const [variantId, timer] of timers.current) {
      clearTimeout(timer);
      const q = draft[variantId];
      if (q !== undefined) send(variantId, q);
    }
    await Promise.all(inFlight.current);
  };

  if (shown.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">{d.emptyCart}</p>
        <Link href={`${base}/${locale}`} className="btn mt-6">
          {d.continueShopping}
        </Link>
      </div>
    );
  }

  const overStock = shown.some((l) => l.quantity > l.available);
  const checkoutHref = `${base}/${locale}/checkout`;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
      <div className="min-w-0">
        <h1 className="mb-6 text-2xl font-black tracking-tight sm:text-3xl">{d.cart}</h1>
        {overStock && <p className="mb-4 rounded-md bg-accent/10 px-4 py-3 text-sm text-accent">{d.stockError}</p>}
        <ul className="divide-y divide-line border-y border-line">
          {shown.map((l) => (
            <CartRow
              key={l.variantId}
              line={l}
              d={d}
              href={`${base}/${locale}/p/${l.productSlug}`}
              total={formatMoney(l.lineTotal, locale, currency)}
              formAction={formAction}
              onChange={(q, delay) => setQuantity(l, q, delay)}
            />
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-lg bg-surface p-5 lg:sticky lg:top-24">
        <OrderSummary d={d} locale={locale} currency={currency} vatRateBp={pricing.vatRateBp} {...totals} />
        {overStock ? (
          <span aria-disabled className="btn mt-6 w-full opacity-40">
            {d.checkout}
          </span>
        ) : (
          <Link
            href={checkoutHref}
            className="btn btn-accent mt-6 w-full"
            onClick={(e) => {
              if (timers.current.size === 0 && inFlight.current.size === 0) return;
              e.preventDefault();
              flush().then(() => router.push(checkoutHref));
            }}
          >
            {d.checkout}
          </Link>
        )}
      </aside>
    </div>
  );
}

function CartRow({
  line,
  d,
  href,
  total,
  formAction,
  onChange,
}: {
  line: CartLine;
  d: Dict;
  href: string;
  total: string;
  formAction: (formData: FormData) => Promise<void>;
  onChange: (quantity: number, delay: number) => void;
}) {
  const q = line.quantity;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_8rem]">
      <div className="col-span-2 min-w-0 sm:col-span-1">
        <Link href={href} className="font-semibold hover:underline">
          {line.title}
        </Link>
        <p className="truncate text-sm text-muted">
          {Object.entries(line.options)
            .map(([k, v]) => `${optionLabel(k, d)}: ${v}`)
            .join(" · ")}
        </p>
        {q > line.available && (
          <p className="text-xs text-accent">
            {d.inStock}: {line.available}
          </p>
        )}
        {/* Own form: if it were tied to the stepper form, Enter in the quantity field would "click" it (first submit button). */}
        <form
          action={formAction}
          onSubmit={(e) => {
            e.preventDefault();
            onChange(0, 0);
          }}
          noValidate
        >
          <input type="hidden" name="variantId" value={line.variantId} />
          <button name="set" value="0" className="mt-1 text-xs text-muted underline hover:text-foreground">
            {d.remove}
          </button>
        </form>
      </div>

      {/* A real form, so the cart also works without JavaScript; with JS the stepper handles everything. */}
      <form action={formAction} onSubmit={(e) => e.preventDefault()} noValidate>
        <input type="hidden" name="variantId" value={line.variantId} />
        {/* First submit button = what Enter in the field triggers without JS (not "−"). */}
        <button type="submit" tabIndex={-1} aria-hidden className="sr-only">
          {d.update}
        </button>
        <QuantityStepper
          value={q}
          max={Math.min(99, line.available)}
          buttonName="set"
          labels={{ decrease: d.decrease, increase: d.increase, quantity: d.quantity, maxAvailable: d.maxAvailable }}
          onChange={(n, kind) => onChange(n, kind === "step" ? BUTTON_DELAY : kind === "type" ? TYPING_DELAY : 0)}
        />
      </form>

      <p className="num h-10 font-semibold leading-10">{total}</p>
    </li>
  );
}
