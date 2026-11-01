import { NextResponse, type NextRequest } from "next/server";
import { readCart, writeCart } from "@/lib/cart";
import { db } from "@/lib/db";
import { cancelPendingOrder } from "@/lib/orders";
import { getStore } from "@/lib/tenant";

/**
 * Stripe "back" button: cancel the pending order, release its stock
 * and put the items back into the cart.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/s/[site]/[locale]/checkout/cancel">) {
  const { site, locale } = await ctx.params;
  const store = await getStore(site);
  const base = req.headers.get("x-store-base") ?? "";
  const orderId = req.nextUrl.searchParams.get("order");

  if (orderId) {
    const order = await db.order.findFirst({
      where: { id: orderId, storeId: store.id, status: "PENDING" },
      include: { items: true },
    });
    if (order) {
      await cancelPendingOrder(order.id);
      const cart = await readCart(store.id);
      for (const item of order.items) {
        if (item.variantId && !cart.some((e) => e.v === item.variantId)) {
          cart.push({ v: item.variantId, q: item.quantity });
        }
      }
      await writeCart(store.id, cart);
    }
  }

  return NextResponse.redirect(new URL(`${base}/${locale}/cart`, req.url));
}
