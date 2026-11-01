import Stripe from "stripe";

/**
 * Stripe Checkout. Payment methods (cards, TWINT, Apple Pay, Google Pay, PostFinance)
 * are switched on in the Stripe dashboard, not in code.
 * Without STRIPE_SECRET_KEY the shop runs in test mode and orders are marked paid instantly.
 */
let stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

const STRIPE_LOCALES = { de: "de", fr: "fr", it: "it", en: "en" } as const;

export async function createCheckoutSession(params: {
  orderId: string;
  storeSlug: string;
  email: string;
  locale: string;
  currency: string;
  shipping: number;
  items: { title: string; options: Record<string, string>; unitPrice: number; quantity: number }[];
  successUrl: string;
  cancelUrl: string;
}) {
  const s = getStripe();
  if (!s) throw new Error("Stripe is not configured");

  const currency = params.currency.toLowerCase();
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: params.email,
    locale: STRIPE_LOCALES[params.locale as keyof typeof STRIPE_LOCALES] ?? "auto",
    line_items: params.items.map((i) => ({
      quantity: i.quantity,
      price_data: {
        currency,
        unit_amount: i.unitPrice,
        product_data: {
          name: i.title,
          description: Object.values(i.options).join(" / ") || undefined,
        },
      },
    })),
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Swiss Post",
          fixed_amount: { amount: params.shipping, currency },
        },
      },
    ],
    metadata: { orderId: params.orderId, store: params.storeSlug },
    payment_intent_data: { metadata: { orderId: params.orderId } },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 h, then stock is released
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}
