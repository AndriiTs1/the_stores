import type { Prisma } from "@/generated/prisma/client";

type InventoryWithLocation = { quantity: number; location: { sellsOnline: boolean } };

/** Stock that can be sold online = sum over locations flagged sellsOnline. */
export function onlineStock(inventory: InventoryWithLocation[]) {
  return inventory.reduce((sum, i) => sum + (i.location.sellsOnline ? i.quantity : 0), 0);
}

export const inventoryInclude = {
  inventory: { include: { location: { select: { sellsOnline: true } } } },
} satisfies Prisma.ProductVariantInclude;

/**
 * Take `quantity` units of a variant from online locations, largest stock first.
 * Must run inside a transaction. Returns false if there is not enough stock.
 */
export async function reserveStock(
  tx: Prisma.TransactionClient,
  variantId: string,
  quantity: number,
): Promise<boolean> {
  const levels = await tx.inventoryLevel.findMany({
    where: { variantId, location: { sellsOnline: true }, quantity: { gt: 0 } },
    orderBy: { quantity: "desc" },
  });
  let left = quantity;
  for (const level of levels) {
    if (left === 0) break;
    const take = Math.min(level.quantity, left);
    // Conditional update guards against two checkouts racing for the last item.
    const res = await tx.inventoryLevel.updateMany({
      where: { id: level.id, quantity: { gte: take } },
      data: { quantity: { decrement: take } },
    });
    if (res.count === 1) left -= take;
  }
  return left === 0;
}

/** Put stock back (cancelled or expired order) into the first online location. */
export async function releaseStock(
  tx: Prisma.TransactionClient,
  storeId: string,
  variantId: string,
  quantity: number,
) {
  const level = await tx.inventoryLevel.findFirst({
    where: { variantId, location: { storeId, sellsOnline: true } },
    orderBy: { quantity: "desc" },
  });
  if (level) {
    await tx.inventoryLevel.update({
      where: { id: level.id },
      data: { quantity: { increment: quantity } },
    });
  }
}
