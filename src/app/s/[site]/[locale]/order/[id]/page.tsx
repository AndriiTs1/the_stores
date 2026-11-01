import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderSummary } from "@/components/order-summary";
import { db } from "@/lib/db";
import { getDict, optionLabel } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { markOrderPaid } from "@/lib/orders";
import { getStripe } from "@/lib/payments";
import { ClearCheckoutDraft } from "./clear-checkout-draft";
import { getBase, getStoreAndLocale, languageAlternates } from "@/lib/tenant";

export async function generateMetadata({ params }: PageProps<"/s/[site]/[locale]/order/[id]">) {
  const { site, locale, id } = await params;
  return {
    title: getDict(locale).orderTitle,
    robots: { index: false },
    alternates: await languageAlternates(site, `/order/${id}`),
  };
}

export default async function OrderPage({ params, searchParams }: PageProps<"/s/[site]/[locale]/order/[id]">) {
  const { site, locale: rawLocale, id } = await params;
  const { session_id } = await searchParams;
  const { store, locale } = await getStoreAndLocale(site, rawLocale);
  const base = await getBase();
  const d = getDict(locale);

  let order = await db.order.findFirst({ where: { id, storeId: store.id }, include: { items: true } });
  if (!order) notFound();

  // Returning from Stripe: confirm right away instead of waiting for the webhook.
  const stripe = getStripe();
  if (order.status === "PENDING" && stripe && typeof session_id === "string" && session_id === order.paymentRef) {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      await markOrderPaid(order.id, "stripe", session.id);
      order = { ...order, status: "PAID" };
    }
  }

  const paid = order.status === "PAID" || order.status === "FULFILLED";

  return (
    <div className="mx-auto max-w-2xl py-4 sm:py-8">
      <ClearCheckoutDraft storeId={store.id} />
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{d.thanks}</h1>
      <p className="mt-2 text-muted">
        {d.orderNumber}: <span className="font-semibold text-foreground">#{order.number}</span>
      </p>
      <p className={`mt-4 rounded-md px-4 py-3 text-sm ${paid ? "bg-green-50 text-green-800" : "bg-surface"}`}>
        {paid ? d.orderPaid : order.status === "PENDING" ? d.orderPending : order.status}
      </p>

      <ul className="mt-8 space-y-2 border-y border-line py-4 text-sm">
        {order.items.map((i) => (
          <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
            <span className="min-w-0">
              {i.quantity} × {i.title}
              {/* Snapshot: values were saved in the shopper's language at checkout. */}
              <span className="block truncate text-xs text-muted">
                {Object.entries(i.options as Record<string, string>)
                  .map(([k, v]) => `${optionLabel(k, d)}: ${v}`)
                  .join(" · ")}
              </span>
            </span>
            <span className="num">{formatMoney(i.lineTotal, locale, order.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <OrderSummary
          d={d}
          locale={locale}
          currency={order.currency}
          vatRateBp={store.vatRateBp}
          subtotal={order.subtotal}
          shipping={order.shipping}
          total={order.total}
          vatAmount={order.vatAmount}
        />
      </div>

      <Link href={`${base}/${locale}`} className="btn mt-10">
        {d.continueShopping}
      </Link>
    </div>
  );
}
