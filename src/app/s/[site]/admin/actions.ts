"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { cancelPendingOrder } from "@/lib/orders";
import { getStore } from "@/lib/tenant";
import { orderStatusSchema, productUpdateSchema, toFieldErrors, type FieldErrors } from "@/lib/validation";

// Admin access is enforced in src/proxy.ts (Basic auth) — replace with real staff login later.

export type ProductFormState = { fieldErrors?: FieldErrors; savedAt?: number };

/** Turn flat form names ("prices.<id>", "stock.<id>") into the nested shape of productUpdateSchema. */
function productFormInput(formData: FormData) {
  const input: Record<string, unknown> = { prices: {}, stock: {} };
  for (const [key, value] of formData) {
    if (typeof value !== "string" || key.startsWith("$")) continue;
    const [group, id] = key.split(".", 2);
    if ((group === "prices" || group === "stock") && id) (input[group] as Record<string, string>)[id] = value;
    else input[key] = value;
  }
  return input;
}

export async function updateProduct(
  site: string,
  productId: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const store = await getStore(site);
  const product = await db.product.findFirst({
    where: { id: productId, storeId: store.id },
    include: { variants: { include: { inventory: true } } },
  });
  if (!product) throw new Error("Product not found");

  const parsed = productUpdateSchema.safeParse(productFormInput(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { status, title_de, title_fr, title_it, title_en, prices, stock } = parsed.data;
  const title = { de: title_de, fr: title_fr ?? "", it: title_it ?? "", en: title_en ?? "" };

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: product.id }, data: { status, title } });

    for (const v of product.variants) {
      const price = prices[v.id];
      if (price != null && price !== v.price) {
        await tx.productVariant.update({ where: { id: v.id }, data: { price } });
      }
      for (const level of v.inventory) {
        const qty = stock[level.id];
        if (qty != null && qty !== level.quantity) {
          await tx.inventoryLevel.update({ where: { id: level.id }, data: { quantity: qty } });
        }
      }
    }
  });

  revalidatePath("/", "layout");
  return { savedAt: Date.now() };
}

export async function setOrderStatus(site: string, orderId: string, formData: FormData) {
  const store = await getStore(site);
  const status = orderStatusSchema.parse(formData.get("status"));
  const order = await db.order.findFirst({ where: { id: orderId, storeId: store.id } });
  if (!order) throw new Error("Order not found");

  if (status === "CANCELLED" && order.status === "PENDING") {
    await cancelPendingOrder(order.id); // also releases stock
  } else {
    await db.order.update({ where: { id: order.id }, data: { status } });
  }
  revalidatePath("/", "layout");
}
