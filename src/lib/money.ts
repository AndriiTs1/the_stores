// All amounts are integer Rappen (1 CHF = 100 Rappen). Prices are VAT-inclusive.

const LOCALE_TAG: Record<string, string> = { de: "de-CH", fr: "fr-CH", it: "it-CH", en: "en-CH" };

export function formatMoney(rappen: number, locale = "de", currency = "CHF") {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? "de-CH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(rappen / 100);
}

/** VAT contained in a gross (VAT-inclusive) amount. Rate in basis points: 810 = 8.1 %. */
export function vatFromGross(gross: number, rateBp: number) {
  return Math.round((gross * rateBp) / (10000 + rateBp));
}

export function shippingFor(subtotal: number, store: { shippingFlat: number; freeShippingFrom: number | null }) {
  if (subtotal === 0) return 0;
  if (store.freeShippingFrom != null && subtotal >= store.freeShippingFrom) return 0;
  return store.shippingFlat;
}

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  vatAmount: number;
  /** Number of items (sum of quantities). */
  count: number;
};

type PricingStore = { shippingFlat: number; freeShippingFrom: number | null; vatRateBp: number };

/**
 * The one place cart totals are computed — used by the cart (also live in the browser),
 * checkout and createPendingOrder, so amounts match to the Rappen everywhere.
 */
export function computeCart(lines: { unitPrice: number; quantity: number }[], store: PricingStore): CartTotals {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const shipping = shippingFor(subtotal, store);
  // No 5-Rappen rounding: card/TWINT charges must match the Stripe line items exactly.
  const total = subtotal + shipping;
  return { subtotal, shipping, total, vatAmount: vatFromGross(total, store.vatRateBp), count };
}
