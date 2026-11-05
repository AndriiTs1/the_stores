import { redirect } from "next/navigation";
import { OrderSummary } from "@/components/order-summary";
import { getCartLines, type CartLine } from "@/lib/cart";
import { getDict, optionLabel, type Dict } from "@/lib/i18n";
import { computeCart, formatMoney } from "@/lib/money";
import { checkoutMode } from "@/lib/payments";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";
import { checkoutDraftKey } from "@/lib/checkout-draft";
import { placeOrder } from "../actions";
import { CheckoutForm } from "./checkout-form";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/checkout">) {
  const { site, locale } = await params;
  return {
    title: getDict(locale).checkout,
    robots: { index: false },
    alternates: await languageAlternates(site, "/checkout"),
  };
}

const COUNTRY_NAMES = {
  CH: { de: "Schweiz", fr: "Suisse", it: "Svizzera", en: "Switzerland" },
  LI: { de: "Liechtenstein", fr: "Liechtenstein", it: "Liechtenstein", en: "Liechtenstein" },
};

export default async function CheckoutPage({ params }: PageProps<"/s/[site]/[locale]/checkout">) {
  const { site, locale: rawLocale } = await params;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);
  const mode = checkoutMode();

  const lines = await getCartLines(store.id, locale);
  if (lines.length === 0) redirect(`${base}/${locale}/cart`);
  const totals = computeCart(lines, store);
  const fmt = (n: number) => formatMoney(n, locale, store.currency);
  const summary = (
    <>
      <LineList lines={lines} d={d} fmt={fmt} />
      <div className="border-t border-line pt-4">
        <OrderSummary d={d} locale={locale} currency={store.currency} vatRateBp={store.vatRateBp} {...totals} />
      </div>
    </>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-10">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:col-span-2">{d.checkout}</h1>

      {/* Phone and tablet: summary collapsed into one line above the form. */}
      <details className="group rounded-lg bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span className="truncate">
            {d.cart} ({totals.count})
          </span>
          <span className="flex items-center gap-2">
            <span className="num">{fmt(totals.total)}</span>
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="size-4 text-muted transition-transform group-open:rotate-180"
            >
              <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </summary>
        <div className="space-y-4 px-4 pb-4">{summary}</div>
      </details>

      <CheckoutForm
        action={placeOrder.bind(null, site, locale)}
        draftKey={checkoutDraftKey(store.id)}
        locale={locale}
        labels={{
          contact: d.contact,
          shipping: d.shipping,
          email: d.email,
          phone: d.phone,
          name: d.name,
          address: d.address,
          zip: d.zip,
          city: d.city,
          country: d.country,
          submit: mode === "closed" ? d.ordersClosed : `${d.payNow} · ${fmt(totals.total)}`,
        }}
        countries={(["CH", "LI"] as const).map((c) => ({
          value: c,
          label: COUNTRY_NAMES[c][locale],
        }))}
        closed={mode === "closed"}
        note={mode === "test" ? d.testModeNote : undefined}
      />

      {/* Desktop: summary in a sticky column on the right. */}
      <aside className="hidden h-fit space-y-4 rounded-lg bg-surface p-5 lg:sticky lg:top-24 lg:block">
        <h2 className="font-semibold">{d.summary}</h2>
        {summary}
      </aside>
    </div>
  );
}

function LineList({ lines, d, fmt }: { lines: CartLine[]; d: Dict; fmt: (n: number) => string }) {
  return (
    <ul className="space-y-2 text-sm">
      {lines.map((l) => (
        <li key={l.variantId} className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
          <span className="min-w-0">
            {l.quantity} × {l.title}
            <span className="block truncate text-xs text-muted">
              {Object.entries(l.options)
                .map(([k, v]) => `${optionLabel(k, d)}: ${v}`)
                .join(" · ")}
            </span>
          </span>
          <span className="num">{fmt(l.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}
