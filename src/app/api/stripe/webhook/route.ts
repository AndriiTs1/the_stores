import type Stripe from "stripe";
import { cancelPendingOrder, markOrderPaid } from "@/lib/orders";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/payments";

/**
 * Stripe webhook — the source of truth for payment status.
 * Dashboard → Developers → Webhooks → endpoint https://<your-domain>/api/stripe/webhook
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *         checkout.session.async_payment_failed, checkout.session.expired
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return new Response("Stripe not configured", { status: 501 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type.startsWith("checkout.session.")) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return Response.json({ ignored: true });

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if (session.payment_status === "paid") {
          const order = await db.order.findUnique({
            where: { id: orderId },
            select: { total: true, currency: true, paymentProvider: true, paymentRef: true },
          });

          if (
            order?.paymentProvider !== "stripe" ||
            order.paymentRef !== session.id ||
            order.total !== session.amount_total ||
            order.currency.toLowerCase() !== session.currency?.toLowerCase()
          ) {
            return new Response("Payment mismatch", { status: 400 });
          }

          await markOrderPaid(orderId, "stripe", session.id);
        }
        break;
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        await cancelPendingOrder(orderId);
        break;
    }
  }

  return Response.json({ received: true });
}
