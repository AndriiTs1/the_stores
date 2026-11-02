import type { Dict } from "./i18n";
import { formatMoney } from "./money";

export type TrustItem = { id: "shipping" | "returns" | "original" | "payment"; title: string; text: string };

type TrustStore = {
  currency: string;
  shippingFlat: number;
  freeShippingFrom: number | null;
  returnDays: number | null;
  originalGoods: boolean;
  paymentMethods: string[];
};

const PAYMENT_NAMES: Record<string, string> = {
  twint: "TWINT",
  postfinance: "PostFinance",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
};

/**
 * The storefront's promises — only what the shop really does or has set:
 * shipping from its rates (always), returns and "original goods" only when set,
 * payment methods only when the shop lists them and Stripe is configured.
 */
export function trustItems(store: TrustStore, stripeConfigured: boolean, d: Dict, locale: string): TrustItem[] {
  const fmt = (n: number) => (n === 0 ? d.free : formatMoney(n, locale, store.currency));
  const items: TrustItem[] = [
    {
      id: "shipping",
      title: d.shipping,
      text:
        store.freeShippingFrom != null && store.shippingFlat > 0
          ? d.trustShippingText.replace("{price}", fmt(store.shippingFlat)).replace("{free}", fmt(store.freeShippingFrom))
          : fmt(store.shippingFlat),
    },
  ];
  if (store.returnDays != null && store.returnDays > 0) {
    items.push({ id: "returns", title: d.trustReturns, text: d.trustReturnsText.replace("{n}", String(store.returnDays)) });
  }
  if (store.originalGoods) {
    items.push({ id: "original", title: d.trustOriginal, text: d.trustOriginalText });
  }
  const methods = store.paymentMethods
    .map((m) => (m === "card" ? d.payCard : PAYMENT_NAMES[m]))
    .filter((name): name is string => Boolean(name));
  if (stripeConfigured && methods.length > 0) {
    items.push({ id: "payment", title: d.trustPayment, text: methods.join(" · ") });
  }
  return items;
}
