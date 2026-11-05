"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearCart, getCartLines, readCart, writeCart, type CartLine } from "@/lib/cart";
import { db } from "@/lib/db";
import { inventoryInclude, onlineStock } from "@/lib/inventory";
import { createPendingOrder, markOrderPaid, OutOfStockError } from "@/lib/orders";
import { checkoutMode, createCheckoutSession } from "@/lib/payments";
import { getBase, getStoreAndLocale } from "@/lib/tenant";
import { addToCartSchema, cartLineSchema, checkoutSchema, toFieldErrors, type FieldErrors } from "@/lib/validation";

export type AddToCartState = { error?: string };

/** Product page form (useActionState): validates with addToCartSchema, returns an error code or redirects to the cart. */
export async function addToCart(
  site: string,
  locale: string,
  _prev: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> {
  const { store } = await getStoreAndLocale(site, locale);
  const parsed = addToCartSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "invalid" };
  const { variantId, quantity } = parsed.data;

  const variant = await findVariant(store.id, variantId);
  const max = variant ? Math.min(99, onlineStock(variant.inventory)) : 0;
  if (!variant || max === 0) return { error: "variant" };

  // Same variant added again: quantities add up, capped by what can be sold online.
  const cart = await readCart(store.id);
  const existing = cart.find((e) => e.v === variantId);
  if (existing) existing.q = Math.min(max, existing.q + quantity);
  else cart.push({ v: variantId, q: Math.min(max, quantity) });
  await writeCart(store.id, cart);

  redirect(`${await getBase()}/${locale}/cart`);
}

function findVariant(storeId: string, variantId: string) {
  return db.productVariant.findFirst({
    where: { id: variantId, product: { storeId, status: "ACTIVE" } },
    include: inventoryInclude,
  });
}

export type CartState = { lines: CartLine[] };

/** Set a line's quantity (0 removes it), capped by online stock. Returns the saved cart. */
async function setCartLine(site: string, locale: string, input: unknown): Promise<CartState> {
  const { store } = await getStoreAndLocale(site, locale);
  const parsed = cartLineSchema.safeParse(input);
  if (!parsed.success) return { lines: await getCartLines(store.id, locale) };
  const { variantId, quantity } = parsed.data;

  let cart = await readCart(store.id);
  const variant = quantity > 0 ? await findVariant(store.id, variantId) : null;
  if (quantity === 0 || !variant) {
    cart = cart.filter((e) => e.v !== variantId);
  } else {
    const stock = onlineStock(variant.inventory);
    // Sold out meanwhile: leave the line as it is (the cart shows the stock warning).
    if (stock > 0) {
      const q = Math.min(quantity, stock, 99);
      const existing = cart.find((e) => e.v === variantId);
      if (existing) existing.q = q;
      else cart.push({ v: variantId, q });
    }
  }
  await writeCart(store.id, cart);
  return { lines: await getCartLines(store.id, locale, cart) };
}

/** Stepper in the cart (called from startTransition). */
export async function updateCartLine(
  site: string,
  locale: string,
  input: { variantId: string; quantity: number },
): Promise<CartState> {
  return setCartLine(site, locale, input);
}

/** No-JS fallback: the stepper is a real form; "set" comes from the −/+/remove button, else the typed quantity. */
export async function updateCartLineForm(site: string, locale: string, formData: FormData) {
  const set = formData.get("set");
  const typed = formData.get("quantity");
  // A typed 0 is ignored like an empty field; removing is the "remove" button (set=0).
  if (set != null || (typed != null && Number(typed) > 0)) {
    await setCartLine(site, locale, { variantId: formData.get("variantId"), quantity: set ?? typed });
  }
  redirect(`${await getBase()}/${locale}/cart`);
}

/** closed: orders are switched off (checkoutMode); nothing was created. */
export type CheckoutState = { fieldErrors?: FieldErrors; closed?: boolean };

/** Used with useActionState: returns field errors (same codes as the browser), redirects on success. */
export async function placeOrder(
  site: string,
  locale: string,
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // Before anything else: no order, no stock reserved, whatever the form says.
  const mode = checkoutMode();
  if (mode === "closed") return { closed: true };

  const { store } = await getStoreAndLocale(site, locale);
  const base = await getBase();

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { email, phone, ...rest } = parsed.data;
  const address = { ...rest, phone: phone || undefined };

  const lines = await getCartLines(store.id, locale);
  if (lines.length === 0) redirect(`${base}/${locale}/cart`);

  let order;
  try {
    order = await createPendingOrder({ store, locale, email, address, lines });
  } catch (e) {
    if (e instanceof OutOfStockError) redirect(`${base}/${locale}/cart?error=stock`);
    throw e;
  }

  const orderUrl = `${base}/${locale}/order/${order.id}`;

  // Test mode: no payment provider configured yet.
  if (mode === "test") {
    await markOrderPaid(order.id, "test", `test_${order.id}`);
    await clearCart(store.id);
    redirect(orderUrl);
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const session = await createCheckoutSession({
    orderId: order.id,
    storeSlug: store.slug,
    email,
    locale,
    currency: store.currency,
    shipping: order.shipping,
    items: order.items.map((i) => ({
      title: i.title,
      options: i.options as Record<string, string>,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
    })),
    successUrl: `${origin}${orderUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}${base}/${locale}/checkout/cancel?order=${order.id}`,
  });

  await db.order.update({ where: { id: order.id }, data: { paymentProvider: "stripe", paymentRef: session.id } });
  await clearCart(store.id);
  redirect(session.url!);
}
