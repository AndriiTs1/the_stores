import { db } from "./db";
import type { CartLine } from "./cart";
import { computeCart } from "./money";
import { releaseStock, reserveStock } from "./inventory";
import type { Store } from "./tenant";

export type ShippingAddress = {
  name: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  phone?: string;
};

export class OutOfStockError extends Error {
  constructor(public sku: string) {
    super(`Out of stock: ${sku}`);
  }
}

/**
 * Create a PENDING order and reserve its stock in one transaction.
 * Stock is given back if payment fails or the checkout session expires.
 */
export async function createPendingOrder(input: {
  store: Store;
  locale: string;
  email: string;
  address: ShippingAddress;
  lines: CartLine[];
}) {
  const { store, locale, email, address, lines } = input;
  const { subtotal, shipping, total, vatAmount } = computeCart(lines, store);

  return db.$transaction(async (tx) => {
    for (const line of lines) {
      const ok = await reserveStock(tx, line.variantId, line.quantity);
      if (!ok) throw new OutOfStockError(line.sku);
    }

    const { orderCounter } = await tx.store.update({
      where: { id: store.id },
      data: { orderCounter: { increment: 1 } },
      select: { orderCounter: true },
    });

    const customer = await tx.customer.upsert({
      where: { storeId_email: { storeId: store.id, email } },
      update: { name: address.name, phone: address.phone },
      create: { storeId: store.id, email, name: address.name, phone: address.phone },
    });

    return tx.order.create({
      data: {
        storeId: store.id,
        number: orderCounter,
        customerId: customer.id,
        email,
        locale,
        currency: store.currency,
        subtotal,
        shipping,
        total,
        vatAmount,
        shippingAddress: address,
        items: {
          create: lines.map((l) => ({
            variantId: l.variantId,
            title: l.title,
            sku: l.sku,
            options: l.options,
            unitPrice: l.unitPrice,
            quantity: l.quantity,
            lineTotal: l.lineTotal,
          })),
        },
      },
      include: { items: true },
    });
  });
}

export async function markOrderPaid(orderId: string, provider: string, paymentRef: string) {
  return db.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "PAID", paymentProvider: provider, paymentRef, paidAt: new Date() },
  });
}

/** Cancel a PENDING order and return its reserved stock. */
export async function cancelPendingOrder(orderId: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== "PENDING") return;
    for (const item of order.items) {
      if (item.variantId) await releaseStock(tx, order.storeId, item.variantId, item.quantity);
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });
}
