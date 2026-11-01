import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import { translateOptions, tr } from "./i18n";
import { inventoryInclude, onlineStock } from "./inventory";

/** The cart lives in a cookie per store: no DB rows for anonymous visitors. */
const CartSchema = z.array(z.object({ v: z.string(), q: z.number().int().min(1).max(99) })).max(50);
export type CartEntry = z.infer<typeof CartSchema>[number];

const cookieName = (storeId: string) => `cart_${storeId}`;

export async function readCart(storeId: string): Promise<CartEntry[]> {
  const raw = (await cookies()).get(cookieName(storeId))?.value;
  if (!raw) return [];
  try {
    const parsed = CartSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

/** Only callable from Server Actions / Route Handlers (cookies are read-only in pages). */
export async function writeCart(storeId: string, entries: CartEntry[]) {
  (await cookies()).set(cookieName(storeId), JSON.stringify(entries.filter((e) => e.q > 0)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCart(storeId: string) {
  (await cookies()).delete(cookieName(storeId));
}

export type CartLine = {
  variantId: string;
  productSlug: string;
  title: string;
  sku: string;
  /** Option values in the shopper's language — also what the order snapshot keeps. */
  options: Record<string, string>;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: number;
};

/** Resolve cookie entries against the database (prices and stock always come from the DB). */
export async function getCartLines(
  storeId: string,
  locale: string,
  entries?: CartEntry[], // pass the entries just written, so a Server Action returns what it saved
): Promise<CartLine[]> {
  entries ??= await readCart(storeId);
  if (entries.length === 0) return [];

  const variants = await db.productVariant.findMany({
    where: { id: { in: entries.map((e) => e.v) }, product: { storeId, status: "ACTIVE" } },
    include: { product: true, ...inventoryInclude },
  });

  return entries.flatMap((entry) => {
    const v = variants.find((x) => x.id === entry.v);
    if (!v) return [];
    return [
      {
        variantId: v.id,
        productSlug: v.product.slug,
        title: tr(v.product.title, locale),
        sku: v.sku,
        options: translateOptions(v.product.optionValues, v.options as Record<string, string>, locale),
        unitPrice: v.price,
        quantity: entry.q,
        lineTotal: v.price * entry.q,
        available: onlineStock(v.inventory),
      },
    ];
  });
}

export async function getCartCount(storeId: string) {
  return (await readCart(storeId)).reduce((n, e) => n + e.q, 0);
}
