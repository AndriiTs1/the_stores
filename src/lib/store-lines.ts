import { cache } from "react";
import { db } from "./db";
import { LINE_ORDER, type LineId } from "./lines";

/** Lines with at least one active product in the store, in display order. Once per request. */
export const storeLines = cache(async (storeId: string): Promise<LineId[]> => {
  const rows = await db.product.groupBy({ by: ["line"], where: { storeId, status: "ACTIVE" } });
  const present = new Set(rows.map((r) => r.line));
  return LINE_ORDER.filter((l) => present.has(l));
});
